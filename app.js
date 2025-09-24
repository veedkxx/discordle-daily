// Base de dados de integrantes
        let pessoas = [];

        async function carregarPersonagens() {
        try {
            const response = await fetch('personagens.json');
            const data = await response.json();
            pessoas = data.pessoas;
            initGame();
        } catch (error) {
            console.error('Erro ao carregar personagens:', error);
        }
        }

        carregarPersonagens();
        
// Variáveis do jogo
let targetPerson;
let attempts = 0;
const maxAttempts = 6;
let gameOver = false;

// Elementos do DOM
const personInput = document.getElementById('person-input');
const submitGuess = document.getElementById('submit-guess');
const guessesContainer = document.getElementById('guesses');
const attemptsCounter = document.getElementById('attempts-counter');
const resultMessage = document.getElementById('result-message');
const newGameBtn = document.getElementById('new-game-btn');

// Função para gerar um seed baseado na data atual
function getDailySeed() {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    return dateString;
}

// Função para gerar um índice aleatório baseado no seed
function getDailyPersonIndex(seed, totalPersonagens) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash; // Converte para inteiro de 32 bits
    }
    return Math.abs(hash) % totalPersonagens;
}

// Função para verificar se já jogou hoje
function alreadyPlayedToday() {
    const lastPlayDate = localStorage.getItem('lastPlayDate');
    return lastPlayDate === getDailySeed();
}

// Função para salvar que jogou hoje
function markAsPlayedToday() {
    localStorage.setItem('lastPlayDate', getDailySeed());
}

// Função para obter o personagem do dia
function getDailyPerson() {
    const seed = getDailySeed();
    const personIndex = getDailyPersonIndex(seed, pessoas.length);
    return pessoas[personIndex];
}

// Função para mostrar mensagem de "já jogou hoje"
function showAlreadyPlayedMessage() {
    // Desabilitar inputs
    personInput.disabled = true;
    submitGuess.disabled = true;
    
    // Mostrar mensagem
    resultMessage.textContent = `Você já jogou hoje! Volte amanhã para um novo personagem.`;
    resultMessage.className = 'result-message info';
    resultMessage.style.display = 'block';
    
    // Mostrar estatísticas do último jogo
    const lastStats = localStorage.getItem('lastGameStats');
    if (lastStats) {
        const stats = JSON.parse(lastStats);
        const statsElement = document.createElement('div');
        statsElement.innerHTML = `<p>Seu resultado de hoje: ${stats.won ? 'Acertou' : 'Não acertou'} em ${stats.attempts} tentativas</p>`;
        resultMessage.appendChild(statsElement);
    }
    
    // Botão para revelar personagem
    const revealBtn = document.createElement('button');
    revealBtn.textContent = 'Revelar Personagem do Dia';
    revealBtn.addEventListener('click', () => {
        alert(`O personagem de hoje era: ${targetPerson.name}`);
    });
    resultMessage.appendChild(revealBtn);
}

// Inicializar o jogo
function initGame() {
    console.log('Iniciando jogo com', pessoas.length, 'personagens');
    
    // Verificar se já jogou hoje
    if (alreadyPlayedToday()) {
        targetPerson = JSON.parse(localStorage.getItem('dailyPerson'));
        showAlreadyPlayedMessage();
        return;
    }
    
    // Selecionar o personagem do dia
    targetPerson = getDailyPerson();
    localStorage.setItem('dailyPerson', JSON.stringify(targetPerson));
    console.log("Personagem do dia:", targetPerson.name);
    
    attempts = 0;
    gameOver = false;
    guessesContainer.innerHTML = '';
    attemptsCounter.textContent = `Tentativas: ${attempts}/${maxAttempts}`;
    resultMessage.style.display = 'none';
    newGameBtn.style.display = 'none';
    personInput.disabled = false;
    submitGuess.disabled = false;
    personInput.focus();
}

// Verificar o palpite
function checkGuess() {
    if (gameOver) return;
    
    const guess = personInput.value.trim();
    if (!guess) return;
    
    // Verificar se o palpite é válido (nome ou alias)
    const guessedPerson = pessoas.find(person => {
        // Verifica se é o nome principal
        if (person.name.toLowerCase() === guess.toLowerCase()) {
            return true;
        }
        
        // Verifica se é algum dos aliases
        if (person.aliases && person.aliases.some(alias => 
            alias.toLowerCase() === guess.toLowerCase())) {
            return true;
        }
        
        return false;
    });
    
    if (!guessedPerson) {
        alert("Integrante não reconhecido. Tente outro nome.");
        personInput.value = '';
        return;
    }
    
    attempts++;
    attemptsCounter.textContent = `Tentativas: ${attempts}/${maxAttempts}`;
    
    // Criar linha de palpite
    const guessRow = document.createElement('div');
    guessRow.className = 'guess-row';
    
    // Adicionar células com os dados do palpite
    addGuessCell(guessRow, guessedPerson.name, guessedPerson.name === targetPerson.name ? 'correct' : 'incorrect', true);
    addGuessCell(guessRow, guessedPerson.gender, guessedPerson.gender === targetPerson.gender ? 'correct' : 'incorrect');
    
    // Verificação especial para idade (com setas)
    const guessedAge = parseInt(guessedPerson.idade);
    const targetAge = parseInt(targetPerson.idade);
    
    addAgeCell(guessRow, guessedPerson.idade, guessedAge, targetAge);
    
    addGuessCell(guessRow, guessedPerson.estado, guessedPerson.estado === targetPerson.estado ? 'correct' : 'incorrect');
    addGuessCell(guessRow, guessedPerson.banido, guessedPerson.banido === targetPerson.banido ? 'correct' : 'incorrect');
    addGuessCell(guessRow, guessedPerson.origem, guessedPerson.origem === targetPerson.origem ? 'correct' : 'incorrect');
    
    guessesContainer.appendChild(guessRow);
    
    // Verificar vitória (agora comparando com o nome principal)
    if (guessedPerson.name.toLowerCase() === targetPerson.name.toLowerCase()) {
        endGame(true);
    } else if (attempts >= maxAttempts) {
        endGame(false);
    }
    
    personInput.value = '';
}

// Adicionar célula à linha de palpite
function addGuessCell(row, content, status, isImage = false) {
    const cell = document.createElement('div');
    cell.className = `guess-cell guess-content ${status}`;
    
    if (isImage) {
        const img = document.createElement('img');
        
        // Encontrar a pessoa correspondente para obter a imagem correta
        const person = pessoas.find(p => p.name === content);
        
        // Usar a propriedade image da pessoa, se disponível
        if (person && person.image) {
            img.src = `./img/${person.image}`;
        } else {
            // Fallback para o nome (em minúsculas) se não houver propriedade image
            img.src = `./img/${content.toLowerCase()}.png`;
        }
        
        img.alt = content;
        img.className = 'person-image';
        img.onerror = function() {
            this.style.display = 'none';
            const text = document.createElement('span');
            text.textContent = content;
            cell.appendChild(text);
        };
        cell.appendChild(img);
    } else {
        cell.textContent = content;
    }
    
    row.appendChild(cell);
}

// Adicionar célula de idade com seta
function addAgeCell(row, content, guessedAge, targetAge) {
    const cell = document.createElement('div');
    cell.className = 'guess-cell guess-content';
    
    const ageContainer = document.createElement('div');
    ageContainer.className = 'age-container';
    
    const ageText = document.createElement('span');
    ageText.textContent = content;
    
    ageContainer.appendChild(ageText);
    
    if (guessedAge === targetAge) {
        cell.classList.add('correct');
    } else {
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        cell.classList.add('incorrect');
        
        if (guessedAge > targetAge) {
            arrow.textContent = '↓';
        } else {
            arrow.textContent = '↑';
        }
        
        ageContainer.appendChild(arrow);
    }
    
    cell.appendChild(ageContainer);
    row.appendChild(cell);
}

// Finalizar o jogo
function endGame(isVictory) {
    gameOver = true;
    
    // Marcar que já jogou hoje
    markAsPlayedToday();
    
    // Salvar estatísticas
    const stats = {
        won: isVictory,
        attempts: attempts,
        date: getDailySeed(),
        person: targetPerson.name
    };
    localStorage.setItem('lastGameStats', JSON.stringify(stats));
    
    if (isVictory) {
        resultMessage.textContent = `Parabéns! Você adivinhou em ${attempts} tentativa(s)!`;
        resultMessage.className = 'result-message victory';
    } else {
        resultMessage.textContent = `Fim de jogo! O integrante era ${targetPerson.name}.`;
        resultMessage.className = 'result-message defeat';
    }
    
    resultMessage.style.display = 'block';
    newGameBtn.style.display = 'block';
    personInput.disabled = true;
    submitGuess.disabled = true;
    
    // Mudar texto do botão para "Próximo Jogo"
    newGameBtn.textContent = 'Próximo Jogo';
    newGameBtn.onclick = () => {
        alert('Volte amanhã para um novo desafio!');
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando jogo...');
    initGame();
});

submitGuess.addEventListener('click', checkGuess);

personInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkGuess();
    }
});

newGameBtn.addEventListener('click', initGame);
