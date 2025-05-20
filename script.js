// ------ Seção: Função para avaliar expressão matemática
// Avalia a expressão informada pelo usuário substituindo 'x' pelo valor passado
function avaliarFuncao(expr, x) {
    try {
        // Usa Function para criar uma função dinâmica. CUIDADO: só use em ambiente controlado!
        return Function('x', 'return ' + expr)(x);
    } catch (e) {
        return NaN;
    }
}

// ------ Seção: Função principal do método da bisseção
// Executa o método da bisseção, retorna passos, histórico e raiz encontrada
function bissecao(funcao, a, b, tol, maxIter) {
    let passos = [];
    let historico = [];
    let fa = avaliarFuncao(funcao, a);
    let fb = avaliarFuncao(funcao, b);
    if (isNaN(fa) || isNaN(fb)) {
        throw new Error('Função inválida.');
    }
    if (fa * fb > 0) {
        throw new Error('f(a) e f(b) devem ter sinais opostos.');
    }
    let m, fm;
    for (let i = 1; i <= maxIter; i++) {
        m = (a + b) / 2;
        fm = avaliarFuncao(funcao, m);
        historico.push({ iter: i, a, b, m, fm });
        passos.push(`Iteração ${i}: a=${a}, b=${b}, m=${m}, f(m)=${fm}`);
        // Critério de parada: tolerância atingida ou intervalo pequeno
        if (Math.abs(fm) < tol || Math.abs(b - a) < tol) {
            passos.push(`Convergência atingida em ${i} iterações. Raiz aproximada: ${m}`);
            break;
        }
        // Atualiza o intervalo conforme o sinal de f(m)
        if (fa * fm < 0) {
            b = m;
            fb = fm;
        } else {
            a = m;
            fa = fm;
        }
    }
    return { passos, historico, raiz: m };
}

// ------ Seção: Manipulação do DOM e eventos
// Seleciona elementos do DOM
const form = document.getElementById('bissecao-form');
const passosDetalhes = document.getElementById('passos-detalhes');
const historicoTabela = document.getElementById('historico-tabela');
const canvas = document.getElementById('grafico-bissecao');

// Labels para responsividade mobile
const labelsTabela = ['Iteração', 'a', 'b', 'm', 'f(m)'];

// Evento de submit do formulário principal
form.addEventListener('submit', function(e) {
    e.preventDefault();
    passosDetalhes.textContent = '';
    historicoTabela.innerHTML = '';
    const funcao = document.getElementById('funcao').value;
    const a = parseFloat(document.getElementById('a').value);
    const b = parseFloat(document.getElementById('b').value);
    const tol = parseFloat(document.getElementById('tol').value);
    const maxIter = parseInt(document.getElementById('max-iter').value);
    try {
        const resultado = bissecao(funcao, a, b, tol, maxIter);
        passosDetalhes.textContent = resultado.passos.join('\n');
        resultado.historico.forEach(item => {
            const row = document.createElement('tr');
            // Adiciona data-label para responsividade mobile
            row.innerHTML = `<td data-label="${labelsTabela[0]}">${item.iter}</td><td data-label="${labelsTabela[1]}">${item.a}</td><td data-label="${labelsTabela[2]}">${item.b}</td><td data-label="${labelsTabela[3]}">${item.m}</td><td data-label="${labelsTabela[4]}">${item.fm}</td>`;
            historicoTabela.appendChild(row);
        });
        desenharGrafico(funcao, a, b, resultado.historico, resultado.raiz);
    } catch (err) {
        passosDetalhes.textContent = 'Erro: ' + err.message;
    }
});

// ------ Seção: Função para desenhar o gráfico
// Desenha gráfico da função, pontos das iterações, intervalo e raiz
function desenharGrafico(funcao, a, b, historico, raiz) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurações do canvas
    const width = canvas.width;
    const height = canvas.height;

    // ------ Sub-seção: Geração dos pontos da função
    // Gera pontos para o gráfico da função no intervalo [a, b]
    const pontos = [];
    let minY = Infinity, maxY = -Infinity;
    for (let x = a; x <= b; x += (b - a) / 400) {
        let y = avaliarFuncao(funcao, x);
        if (!isFinite(y)) continue; // Ignora valores não finitos
        pontos.push({ x, y });
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    // Ajusta limites para melhor visualização
    if (minY === maxY) {
        minY -= 1;
        maxY += 1;
    }

    // ------ Sub-seção: Conversão de coordenadas matemáticas para canvas
    function toCanvasX(x) {
        return ((x - a) / (b - a)) * width;
    }
    function toCanvasY(y) {
        return height - ((y - minY) / (maxY - minY)) * height;
    }

    // ------ Sub-seção: Grade e marcações dos eixos
    ctx.save();
    ctx.strokeStyle = "#eee";
    ctx.fillStyle = "#888";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    let nDivX = 10;
    for (let i = 0; i <= nDivX; i++) {
        let xVal = a + (i / nDivX) * (b - a);
        let xCanvas = toCanvasX(xVal);
        ctx.beginPath();
        ctx.moveTo(xCanvas, 0);
        ctx.lineTo(xCanvas, height);
        ctx.stroke();
        ctx.fillText(xVal.toFixed(2), xCanvas, height - 18);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    let nDivY = 8;
    for (let i = 0; i <= nDivY; i++) {
        let yVal = minY + (i / nDivY) * (maxY - minY);
        let yCanvas = toCanvasY(yVal);
        ctx.beginPath();
        ctx.moveTo(0, yCanvas);
        ctx.lineTo(width, yCanvas);
        ctx.stroke();
        ctx.fillText(yVal.toFixed(2), 40, yCanvas);
    }
    ctx.restore();

    // ------ Sub-seção: Eixos X e Y
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(width, toCanvasY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), height);
    ctx.stroke();

    // ------ Sub-seção: Gráfico da função
    ctx.save();
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < pontos.length; i++) {
        let p = pontos[i];
        let cx = toCanvasX(p.x);
        let cy = toCanvasY(p.y);
        if (i === 0) {
            ctx.moveTo(cx, cy);
        } else {
            ctx.lineTo(cx, cy);
        }
    }
    ctx.stroke();
    ctx.restore();

    // ------ Sub-seção: Pontos das iterações
    historico.forEach((item, idx) => {
        ctx.beginPath();
        ctx.arc(toCanvasX(item.m), toCanvasY(item.fm), 5, 0, 2 * Math.PI);
        ctx.fillStyle = idx === historico.length - 1 ? '#e74c3c' : '#27ae60'; // Último ponto em vermelho
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.stroke();
    });

    // ------ Sub-seção: Destaque do intervalo
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toCanvasX(a), 0);
    ctx.lineTo(toCanvasX(a), height);
    ctx.moveTo(toCanvasX(b), 0);
    ctx.lineTo(toCanvasX(b), height);
    ctx.strokeStyle = '#f39c12';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ------ Sub-seção: Destaque da raiz final
    ctx.save();
    ctx.beginPath();
    ctx.arc(toCanvasX(raiz), toCanvasY(0), 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.restore();
} 