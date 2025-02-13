// Dados de exemplo para jogos em destaque
const featuredGames = [
    {
        id: 1,
        name: 'Free Fire',
        image: '/images/free-fire.jpg',
        description: 'Apostas em partidas de Free Fire',
        minBet: 10,
        maxBet: 1000
    },
    {
        id: 2,
        name: 'PUBG Mobile',
        image: '/images/pubg.jpg',
        description: 'Apostas em partidas de PUBG Mobile',
        minBet: 10,
        maxBet: 1000
    },
    {
        id: 3,
        name: 'Call of Duty Mobile',
        image: '/images/cod-mobile.jpg',
        description: 'Apostas em partidas de COD Mobile',
        minBet: 10,
        maxBet: 1000
    }
];

// Função para carregar os jogos em destaque
function loadFeaturedGames() {
    const gamesGrid = document.querySelector('.games-grid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = featuredGames.map(game => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}" onerror="this.src='/images/placeholder.jpg'">
            </div>
            <div class="game-info">
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                <div class="bet-limits">
                    <span>Min: R$ ${game.minBet}</span>
                    <span>Max: R$ ${game.maxBet}</span>
                </div>
                <button class="btn btn-primary" onclick="openBetModal(${game.id})">Apostar</button>
            </div>
        </div>
    `).join('');
}

// Função para abrir modal de aposta
function openBetModal(gameId) {
    // Verificar se o usuário está logado
    if (!isUserLoggedIn()) {
        alert('Por favor, faça login para realizar apostas.');
        return;
    }

    // Implementação do modal de aposta será adicionada posteriormente
    console.log(`Abrir modal de aposta para o jogo ${gameId}`);
}

// Função para verificar se o usuário está logado
function isUserLoggedIn() {
    // Implementação real será feita posteriormente
    return false;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedGames();

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Implementação do login será adicionada posteriormente
            console.log('Abrir modal de login');
        });
    }

    // Botões da hero section
    const heroBtn = document.querySelector('.hero .btn-primary');
    if (heroBtn) {
        heroBtn.addEventListener('click', () => {
            const gamesSection = document.querySelector('.featured-games');
            if (gamesSection) {
                gamesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    const termsSection = document.getElementById('terms-section');
    const betSection = document.getElementById('bet-section');
    const acceptTermsCheckbox = document.getElementById('accept-terms');
    const continueBtn = document.getElementById('continue-btn');
    const betAmountInput = document.getElementById('bet-amount');
    const submitBetBtn = document.getElementById('submit-bet');
    const clearSignatureBtn = document.getElementById('clearSignature');
    const steps = document.querySelectorAll('.step');

    // Inicializar o pad de assinatura
    const canvas = document.getElementById('signaturePad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        velocityFilterWeight: 0.7,
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16
    });

    // Ajustar o tamanho do canvas
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Atualizar os passos do progresso
    function updateProgressSteps(currentStep) {
        steps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // Limpar assinatura
    clearSignatureBtn.addEventListener('click', () => {
        signaturePad.clear();
        acceptTermsCheckbox.checked = false;
        acceptTermsCheckbox.disabled = true;
        continueBtn.disabled = true;
        updateProgressSteps(1);
    });

    // Verificar assinatura e habilitar checkbox
    signaturePad.addEventListener("endStroke", () => {
        const hasSignature = !signaturePad.isEmpty();
        acceptTermsCheckbox.disabled = !hasSignature;
        
        if (hasSignature) {
            updateProgressSteps(2);
            acceptTermsCheckbox.disabled = false;
        } else {
            updateProgressSteps(1);
            acceptTermsCheckbox.disabled = true;
            acceptTermsCheckbox.checked = false;
        }
    });

    // Gerenciar checkbox dos termos
    acceptTermsCheckbox.addEventListener('change', (e) => {
        if (e.target.checked && !signaturePad.isEmpty()) {
            continueBtn.disabled = false;
        } else {
            continueBtn.disabled = true;
        }
    });

    // Função para mostrar loading skeleton
    function showSkeleton(section) {
        if (section === 'bet') {
            betSection.innerHTML = `
                <div class="bet-container container-transition">
                    <div class="bet-header">
                        <div class="skeleton skeleton-circle"></div>
                        <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    </div>
                    <div class="bet-form">
                        <div class="skeleton skeleton-text" style="width: 40%;"></div>
                        <div class="skeleton skeleton-input"></div>
                        <div class="bet-limits">
                            <div class="skeleton skeleton-text" style="width: 45%;"></div>
                            <div class="skeleton skeleton-text" style="width: 45%;"></div>
                        </div>
                        <div class="bet-actions">
                            <div class="skeleton skeleton-button"></div>
                            <div class="skeleton skeleton-button"></div>
                        </div>
                    </div>
                </div>
            `;
        } else if (section === 'processing') {
            return `
                <div class="processing-container container-transition">
                    <div class="processing-header">
                        <div class="skeleton skeleton-circle"></div>
                        <div class="skeleton skeleton-text" style="width: 50%;"></div>
                    </div>
                    <div class="processing-content">
                        <div class="payment-info">
                            <div class="skeleton skeleton-text" style="width: 100%;"></div>
                            <div class="skeleton skeleton-text" style="width: 100%;"></div>
                            <div class="skeleton skeleton-text" style="width: 100%;"></div>
                        </div>
                        <div class="payment-steps">
                            <div class="skeleton skeleton-text" style="width: 40%;"></div>
                            <div class="skeleton skeleton-text" style="width: 90%;"></div>
                            <div class="skeleton skeleton-text" style="width: 85%;"></div>
                            <div class="skeleton skeleton-text" style="width: 80%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Formatar input de valor em tempo real
    function formatCurrency(input) {
        let value = input.value.replace(/\D/g, '');
        value = (parseInt(value) / 100).toFixed(2);
        
        if (value === 'NaN') {
            input.value = '';
            return;
        }

        const numValue = parseFloat(value);
        if (numValue < 10) {
            input.classList.add('invalid');
        } else if (numValue > 1000) {
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
        }

        input.value = value;
    }

    // Gerenciar botão de continuar
    continueBtn.addEventListener('click', () => {
        if (acceptTermsCheckbox.checked && !signaturePad.isEmpty()) {
            const signatureData = signaturePad.toDataURL();
            localStorage.setItem('userSignature', signatureData);
            
            updateProgressSteps(3);
            termsSection.classList.add('hidden');
            
            // Mostrar skeleton loading
            showSkeleton('bet');
            
            // Mostrar seção de apostas após delay
            setTimeout(() => {
                betSection.classList.remove('hidden');
                const betAmount = document.getElementById('bet-amount');
                const submitBtn = document.getElementById('submit-bet');
                const cancelBtn = document.getElementById('cancel-bet');

                // Formatar input de valor em tempo real
                betAmount.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    
                    if (value) {
                        // Converte para número e divide por 100 para ter os centavos
                        value = (parseInt(value) / 100).toFixed(2);
                        
                        // Formata o número para o padrão brasileiro
                        value = value.replace('.', ',');
                        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                        
                        e.target.value = value;
                        
                        // Valida o valor
                        const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
                        const isValid = numericValue >= 10 && numericValue <= 1000;
                        
                        submitBtn.disabled = !isValid;
                        
                        if (isValid) {
                            betAmount.classList.remove('invalid');
                        } else {
                            betAmount.classList.add('invalid');
                        }
                    } else {
                        e.target.value = '';
                        submitBtn.disabled = true;
                    }
                });

                // Gerenciar envio da aposta
                submitBtn.addEventListener('click', async () => {
                    const value = betAmount.value.replace(/\./g, '').replace(',', '.');
                    const numericValue = parseFloat(value);
                    
                    if (numericValue < 10 || numericValue > 1000) {
                        alert('O valor da aposta deve estar entre R$ 10,00 e R$ 1.000,00');
                        return;
                    }

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<div class="loading-spinner"></div><span>Processando...</span>';

                    try {
                        const signatureData = localStorage.getItem('userSignature');
                        const response = await fetch('/api/create-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                amount: numericValue,
                                signature: signatureData
                            })
                        });

                        const data = await response.json();

                        if (data.processId) {
                            submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Sucesso!</span>';
                            setTimeout(() => {
                                window.location.href = '/payment.html';
                            }, 1000);
                        } else {
                            throw new Error('ID do processo não recebido');
                        }
                    } catch (error) {
                        console.error('Erro ao processar pagamento:', error);
                        alert('Erro ao processar o pagamento. Por favor, tente novamente.');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Confirmar Aposta</span>';
                    }
                });

                // Cancelar aposta
                cancelBtn.addEventListener('click', () => {
                    betSection.classList.add('hidden');
                    termsSection.classList.remove('hidden');
                    updateProgressSteps(1);
                    signaturePad.clear();
                    acceptTermsCheckbox.checked = false;
                    acceptTermsCheckbox.disabled = true;
                    continueBtn.disabled = true;
                    betAmount.value = '';
                });
            }, 1000);
        }
    });

    // Função para copiar texto para a área de transferência
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Feedback visual pode ser adicionado aqui
        }).catch(err => {
            console.error('Erro ao copiar:', err);
        });
    }

    // Adicionar classe active ao link de navegação atual
    function updateActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Atualizar link ativo quando a página carregar
    document.addEventListener('DOMContentLoaded', updateActiveNavLink);
});

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se a resposta é JSON (erro) ou HTML
    const contentType = document.contentType || '';
    if (contentType.includes('application/json')) {
        try {
            // Se for JSON, é porque houve um erro
            const errorData = JSON.parse(document.body.textContent);
            await Swal.fire({
                title: errorData.code === 'LINK_EXPIRED' ? 'Link Expirado' : 'Erro',
                text: errorData.error,
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
            // Redirecionar para a página inicial
            window.location.href = '/';
            return;
        } catch (error) {
            console.error('Erro ao processar resposta:', error);
        }
    }

    // Se chegou aqui, continua com o código normal da página
    // Elementos do DOM
    const signaturePad = new SignaturePad(document.getElementById('signaturePad'));
    const clearButton = document.getElementById('clearSignature');
    const submitButton = document.getElementById('submit-form');
    const termsCheckbox = document.getElementById('accept-terms');
    const uploadContainer = document.getElementById('uploadContainer');
    const fileInput = document.getElementById('receipt');
    const selectedFileName = document.getElementById('selectedFileName');
    const steps = document.querySelectorAll('.step');
    const signerNameInput = document.getElementById('signer-name');
    const signatureNameDisplay = document.getElementById('signature-name');

    // Atualizar os passos do progresso
    function updateProgressSteps(currentStep) {
        steps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // Ajustar o tamanho do canvas com base no pixel ratio do dispositivo
    function resizeCanvas() {
        const canvas = signaturePad.canvas;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
        updateSignatureName();
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Atualizar nome abaixo da assinatura
    function updateSignatureName() {
        if (signerNameInput && signatureNameDisplay) {
            const name = signerNameInput.value.trim();
            signatureNameDisplay.textContent = name;
        }
    }

    // Verificar se o nome foi preenchido antes de permitir assinar
    function checkNameBeforeSigning(e) {
        if (!signerNameInput) return true;
        
        const name = signerNameInput.value.trim();
        if (!name) {
            e.preventDefault();
            e.stopPropagation();
            Swal.fire({
                title: 'Nome obrigatório',
                text: 'Por favor, digite seu nome antes de assinar.',
                icon: 'warning',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
            signerNameInput.focus();
            return false;
        }
        return true;
    }

    // Adicionar listeners para o canvas
    if (signaturePad && signaturePad.canvas) {
        signaturePad.canvas.addEventListener('mousedown', function(e) {
            if (!checkNameBeforeSigning(e)) return;
        });

        signaturePad.canvas.addEventListener('touchstart', function(e) {
            if (!checkNameBeforeSigning(e)) return;
        });
    }

    // Listener para o campo de nome
    if (signerNameInput) {
        signerNameInput.addEventListener('input', updateSignatureName);
    }

    // Limpar assinatura
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            signaturePad.clear();
            if (termsCheckbox) {
                termsCheckbox.checked = false;
                termsCheckbox.disabled = true;
            }
            validateForm();
            updateProgressSteps(1);
        });
    }

    // Manipulação do upload de arquivo
    if (uploadContainer && fileInput) {
        uploadContainer.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', function(e) {
            handleFileSelect(e.target.files[0]);
        });

        uploadContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });

        uploadContainer.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });

        uploadContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (fileInput && file) {
                // Criar um novo objeto DataTransfer
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                // Atualizar os arquivos do input
                fileInput.files = dataTransfer.files;
                handleFileSelect(file);
            }
        });
    }

    function handleFileSelect(file) {
        if (!file) return;

        // Verificar o tipo do arquivo
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            Swal.fire({
                title: 'Arquivo inválido',
                text: 'Por favor, selecione apenas arquivos JPG, PNG ou PDF.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
            if (fileInput) fileInput.value = '';
            if (selectedFileName) selectedFileName.textContent = '';
            validateForm(); // Chamar validateForm para atualizar estado do botão
            return;
        }

        // Verificar o tamanho do arquivo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                title: 'Arquivo muito grande',
                text: 'O arquivo deve ter no máximo 5MB.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
            if (fileInput) fileInput.value = '';
            if (selectedFileName) selectedFileName.textContent = '';
            validateForm(); // Chamar validateForm para atualizar estado do botão
            return;
        }

        // Mostrar o nome do arquivo selecionado
        if (selectedFileName) {
            selectedFileName.textContent = `Arquivo selecionado: ${file.name}`;
        }

        // Chamar validateForm para atualizar estado do botão
        validateForm();

        // Mostrar mensagem de sucesso
        Swal.fire({
            title: 'Arquivo selecionado!',
            text: 'Comprovante carregado com sucesso.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            position: 'top-end',
            toast: true
        });
    }

    // Validação do formulário
    function validateForm() {
        if (!submitButton) return;
        
        const isSignatureValid = !signaturePad.isEmpty();
        const isFileSelected = fileInput && fileInput.files.length > 0;
        const isTermsAccepted = termsCheckbox && termsCheckbox.checked;
        const hasName = signerNameInput && signerNameInput.value.trim() !== '';

        if (submitButton) {
            submitButton.disabled = !(isSignatureValid && isFileSelected && isTermsAccepted && hasName);
        }
    }

    // Event listeners para validação
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', validateForm);
    }

    if (signerNameInput) {
        signerNameInput.addEventListener('input', validateForm);
    }
    
    if (signaturePad) {
        signaturePad.addEventListener('endStroke', () => {
            validateForm();
            const hasSignature = !signaturePad.isEmpty();
            if (termsCheckbox) {
                termsCheckbox.disabled = !hasSignature;
            }
            updateProgressSteps(hasSignature ? 2 : 1);
        });
    }

    // Adicionar função para capturar o formulário
    async function captureFormState() {
        const formContainer = document.querySelector('.form-container');
        try {
            const canvas = await html2canvas(formContainer, {
                scale: 1,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.error('Erro ao capturar formulário:', error);
            return null;
        }
    }

    // Atualizar o evento de submit do formulário
    if (submitButton) {
        submitButton.addEventListener('click', async function(e) {
            e.preventDefault();

            const urlParams = new URLSearchParams(window.location.search);
            const linkId = urlParams.get('id');
            const name = signerNameInput ? signerNameInput.value.trim() : '';

            if (!linkId) {
                Swal.fire({
                    title: 'Erro',
                    text: 'ID do link não encontrado.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#2563eb'
                });
                return;
            }

            if (!name) {
                Swal.fire({
                    title: 'Nome obrigatório',
                    text: 'Por favor, digite seu nome completo.',
                    icon: 'warning',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#2563eb'
                });
                if (signerNameInput) signerNameInput.focus();
                return;
            }

            try {
                // Capturar o estado do formulário
                const formScreenshot = await captureFormState();

                const formData = new FormData();
                formData.append('linkId', linkId);
                formData.append('signature', signaturePad.toDataURL());
                formData.append('termsAccepted', termsCheckbox.checked);
                formData.append('receipt', fileInput.files[0]);
                formData.append('name', name);
                if (formScreenshot) {
                    formData.append('formScreenshot', formScreenshot);
                }

                if (submitButton) submitButton.disabled = true;

                // Mostrar loading
                Swal.fire({
                    title: 'Enviando dados...',
                    text: 'Por favor, aguarde.',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch('/api/submit', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success && result.redirectUrl) {
                    await Swal.fire({
                        title: 'Sucesso!',
                        text: 'Dados enviados com sucesso.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    window.location.href = result.redirectUrl;
                } else if (response.status === 404) {
                    await Swal.fire({
                        title: 'Link Expirado',
                        text: result.error,
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#2563eb'
                    });
                    // Redirecionar para a página inicial após 3 segundos
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                } else {
                    throw new Error(result.error || 'Erro ao enviar dados');
                }
            } catch (error) {
                Swal.fire({
                    title: 'Erro',
                    text: error.message,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#2563eb'
                });
                if (submitButton) submitButton.disabled = false;
            }
        });
    }
}); 