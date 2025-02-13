require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs').promises;
const requestIp = require('request-ip');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');

const app = express();

// Criar diretórios necessários
const DATA_DIR = path.join(__dirname, '../data');
const TRANSACTIONS_DIR = path.join(DATA_DIR, 'transactions');
const RECEIPTS_DIR = path.join(DATA_DIR, 'receipts');
const SIGNATURES_DIR = path.join(DATA_DIR, 'signatures');
const LINKS_DIR = path.join(DATA_DIR, 'links');

async function createDirectories() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(TRANSACTIONS_DIR, { recursive: true });
        await fs.mkdir(RECEIPTS_DIR, { recursive: true });
        await fs.mkdir(SIGNATURES_DIR, { recursive: true });
        await fs.mkdir(LINKS_DIR, { recursive: true });
    } catch (error) {
        console.error('Erro ao criar diretórios:', error);
    }
}

createDirectories();

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, RECEIPTS_DIR)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Aceitar apenas imagens e PDFs
        if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
            return cb(new Error('Apenas imagens e PDFs são permitidos!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

// Rota principal
app.get('/', (req, res) => {
    res.json({
        status: true,
        message: "API funcionando",
        endpoints: {
            createLink: "POST /api/links",
            submitData: "POST /api/submit",
            searchByName: "GET /consulta/:name",
            createPage: "GET /create"
        },
        version: "1.0.0"
    });
});

// Rota para página de criação de links
app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/create.html'));
});

// Rota para página de busca de consultas
app.get('/consulta', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/consulta-busca.html'));
});

// Servir arquivos estáticos apenas na rota /links
app.get('/links', async (req, res) => {
    const linkId = req.query.id;
    if (!linkId) {
        return res.status(400).json({ 
            error: 'ID do link não fornecido',
            code: 'MISSING_LINK_ID'
        });
    }

    // Verificar se o link existe e está dentro do limite
    const link = await getLink(linkId);
    if (!link) {
        return res.status(404).json({ 
            error: 'Link não encontrado',
            code: 'LINK_NOT_FOUND'
        });
    }

    // Verificar se o link atingiu o limite de submissões
    if (link.submissions >= link.numApostadores) {
        return res.status(404).json({ 
            error: 'Link não existe mais. O limite de apostadores foi atingido.',
            code: 'LINK_EXPIRED'
        });
    }

    // Se o link for válido e estiver dentro do limite, enviar o HTML
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Servir arquivos estáticos apenas quando necessário
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/data/receipts', express.static(RECEIPTS_DIR));
app.use('/data/signatures', express.static(SIGNATURES_DIR));

// Funções auxiliares
async function saveTransaction(transaction) {
    const filePath = path.join(TRANSACTIONS_DIR, `${transaction.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(transaction, null, 2));
}

async function getTransaction(id) {
    const filePath = path.join(TRANSACTIONS_DIR, `${id}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

async function saveSignature(id, signatureData) {
    const filePath = path.join(SIGNATURES_DIR, `${id}.png`);
    const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
    await fs.writeFile(filePath, base64Data, 'base64');
    return `data/signatures/${id}.png`;
}

async function saveLink(linkData) {
    const filePath = path.join(LINKS_DIR, `${linkData.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(linkData, null, 2));
}

async function getLink(id) {
    const filePath = path.join(LINKS_DIR, `${id}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

async function findTransactionsByName(name) {
    const files = await fs.readdir(TRANSACTIONS_DIR);
    const transactions = await Promise.all(
        files.map(async (file) => {
            const data = await fs.readFile(path.join(TRANSACTIONS_DIR, file), 'utf8');
            return JSON.parse(data);
        })
    );
    return transactions.filter(t => t.name.toLowerCase().includes(name.toLowerCase()));
}

// Função para extrair texto de imagem
async function extractTextFromImage(filePath) {
    try {
        // Otimizar imagem para OCR
        const optimizedImagePath = filePath + '_optimized.png';
        await sharp(filePath)
            .resize(1500, null, { withoutEnlargement: true })
            .normalize()
            .sharpen()
            .png()
            .toFile(optimizedImagePath);

        const result = await Tesseract.recognize(optimizedImagePath, 'por');
        await fs.unlink(optimizedImagePath); // Limpar arquivo temporário
        return result.data.text;
    } catch (error) {
        console.error('Erro ao extrair texto da imagem:', error);
        return '';
    }
}

// Função para extrair texto de PDF
async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Erro ao extrair texto do PDF:', error);
        return '';
    }
}

// Função para validar comprovante
async function validateReceipt(filePath, name) {
    try {
        let text;
        if (filePath.toLowerCase().endsWith('.pdf')) {
            text = await extractTextFromPDF(filePath);
        } else {
            text = await extractTextFromImage(filePath);
        }

        // Converter texto e nome para minúsculas e remover acentos
        const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Dividir o nome em partes
        const nameParts = normalizedName.split(' ').filter(part => part.length > 2);

        // Verificar se pelo menos uma parte significativa do nome está presente
        const hasName = nameParts.some(part => normalizedText.includes(part));

        // Retornar válido se encontrou o nome, sem outras validações
        return {
            isValid: true, // Sempre retorna true para não validar outros elementos
            hasName,
            text
        };
    } catch (error) {
        console.error('Erro ao validar comprovante:', error);
        return { isValid: false, hasName: false, text: '' };
    }
}

// Rota para criar novo link
app.post('/api/links', async (req, res) => {
    try {
        const { numApostadores, nomeAposta, redirectUrl } = req.body;
        
        if (!numApostadores || !nomeAposta || !redirectUrl) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        const linkId = crypto.randomBytes(8).toString('hex');
        const linkData = {
            id: linkId,
            numApostadores: parseInt(numApostadores),
            nomeAposta,
            redirectUrl,
            createdAt: new Date().toISOString(),
            submissions: 0
        };

        await saveLink(linkData);

        res.json({ 
            success: true, 
            linkId,
            url: `/links?id=${linkId}` 
        });
    } catch (error) {
        console.error('Erro ao criar link:', error);
        res.status(500).json({ error: 'Erro ao criar link' });
    }
});

// Rota para submeter dados
app.post('/api/submit', upload.single('receipt'), async (req, res) => {
    try {
        const { linkId, signature, termsAccepted, name } = req.body;
        
        if (!linkId || !signature || !termsAccepted || !req.file || !name) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // Verificar link
        const link = await getLink(linkId);
        if (!link) {
            return res.status(404).json({ 
                error: 'Link não encontrado',
                code: 'LINK_NOT_FOUND'
            });
        }

        // Verificar limite de submissões
        if (link.submissions >= link.numApostadores) {
            return res.status(404).json({ 
                error: 'Link não existe mais. O limite de apostadores foi atingido.',
                code: 'LINK_EXPIRED'
            });
        }

        // Validar comprovante
        const validation = await validateReceipt(req.file.path, name);
        
        if (!validation.isValid) {
            await fs.unlink(req.file.path); // Remover arquivo inválido
            return res.status(400).json({ 
                error: 'Comprovante inválido. Certifique-se de enviar um comprovante de pagamento válido.' 
            });
        }

        if (!validation.hasName) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ 
                error: 'O nome digitado não corresponde ao nome no comprovante, provavelmente você digitou errado o nome ou o comprovante não é seu digite o nome corretamente da pessoa que pagou.' 
            });
        }

        // Salvar assinatura
        const transactionId = crypto.randomBytes(8).toString('hex');
        const signatureUrl = await saveSignature(transactionId, signature);

        // Criar transação
        const transaction = {
            id: transactionId,
            name,
            linkId,
            signatureUrl,
            receiptUrl: `data/receipts/${req.file.filename}`,
            termsAccepted: true,
            createdAt: new Date().toISOString(),
            ipAddress: req.clientIp,
            receiptText: validation.text,
            nomeAposta: link.nomeAposta,
            numApostadores: link.numApostadores,
            submissions: link.submissions + 1
        };

        // Salvar screenshot se fornecido
        if (req.body.formScreenshot) {
            const screenshotFileName = `${transactionId}-form.jpg`;
            const screenshotPath = path.join(DATA_DIR, 'screenshots', screenshotFileName);
            const base64Data = req.body.formScreenshot.replace(/^data:image\/jpeg;base64,/, "");
            
            // Criar diretório de screenshots se não existir
            await fs.mkdir(path.join(DATA_DIR, 'screenshots'), { recursive: true });
            await fs.writeFile(screenshotPath, base64Data, 'base64');
            
            transaction.formScreenshot = `data/screenshots/${screenshotFileName}`;
        }

        await saveTransaction(transaction);

        // Atualizar contagem de submissões do link
        link.submissions += 1;
        await saveLink(link);

        res.json({
            success: true,
            redirectUrl: link.redirectUrl
        });
    } catch (error) {
        console.error('Erro ao submeter dados:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ error: 'Erro ao submeter dados' });
    }
});

// Rota para consulta
app.get('/consulta/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const transactions = await findTransactionsByName(name);
        
        if (transactions.length === 0) {
            return res.status(404).json({ message: 'Nenhum registro encontrado' });
        }

        // Verificar se o cliente aceita HTML
        const acceptsHtml = req.accepts(['html', 'json']) === 'html';

        if (acceptsHtml) {
            // Retornar a página HTML
            return res.sendFile(path.join(__dirname, '../public/consulta.html'));
        }

        // Se não aceitar HTML, retornar JSON como antes
        const detailedTransactions = transactions.map(t => ({
            id: t.id,
            nome: t.name,
            dataAssinatura: t.createdAt,
            assinatura: t.signatureUrl,
            comprovante: t.receiptUrl,
            screenshotFormulario: t.formScreenshot,
            historico: {
                dadosPreenchidos: {
                    nomeDigitado: t.name,
                    termoAceito: t.termsAccepted,
                    dataHoraSubmissao: t.createdAt,
                    ip: t.ipAddress
                },
                link: {
                    id: t.linkId,
                    nomeAposta: t.nomeAposta,
                    totalApostadores: t.numApostadores,
                    apostadoresConfirmados: t.submissions
                },
                validacaoComprovante: {
                    nomeEncontrado: true,
                    textoExtraido: t.receiptText
                }
            }
        }));

        res.json(detailedTransactions);
    } catch (error) {
        console.error('Erro ao buscar registros:', error);
        res.status(500).json({ error: 'Erro ao buscar registros' });
    }
});

// Rota para API de consulta (sempre retorna JSON)
app.get('/api/consulta/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const transactions = await findTransactionsByName(name);
        
        if (transactions.length === 0) {
            return res.status(404).json({ message: 'Nenhum registro encontrado' });
        }

        const detailedTransactions = transactions.map(t => ({
            id: t.id,
            nome: t.name,
            dataAssinatura: t.createdAt,
            assinatura: t.signatureUrl,
            comprovante: t.receiptUrl,
            screenshotFormulario: t.formScreenshot,
            historico: {
                dadosPreenchidos: {
                    nomeDigitado: t.name,
                    termoAceito: t.termsAccepted,
                    dataHoraSubmissao: t.createdAt,
                    ip: t.ipAddress
                },
                link: {
                    id: t.linkId,
                    nomeAposta: t.nomeAposta,
                    totalApostadores: t.numApostadores,
                    apostadoresConfirmados: t.submissions
                },
                validacaoComprovante: {
                    nomeEncontrado: true,
                    textoExtraido: t.receiptText
                }
            }
        }));

        res.json(detailedTransactions);
    } catch (error) {
        console.error('Erro ao buscar registros:', error);
        res.status(500).json({ error: 'Erro ao buscar registros' });
    }
});

// Adicionar rota para servir os screenshots
app.use('/data/screenshots', express.static(path.join(DATA_DIR, 'screenshots')));

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 