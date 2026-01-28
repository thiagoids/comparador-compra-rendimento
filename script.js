// Atalho para buscar elementos pelo id
const el = id => document.getElementById(id);

// Converte valores digitados em número
const num = v =>
  parseFloat(v.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

// Formata número como moeda
const moeda = v => v.toFixed(2).replace('.', ',');

// Máscara monetária
function maskMoney(i) {
  i.addEventListener('input', () => {
    let v = i.value.replace(/\D/g, '');
    i.value = (v / 100).toFixed(2).replace('.', ',');
  });
}

// Máscara decimal simples
function maskDec(i) {
  i.addEventListener('input', () => {
    i.value = i.value.replace(/[^0-9.,]/g, '');
  });
}

// Alíquota regressiva de IRPF para CDB
function ir(dias) {
  return dias <= 180 ? 0.225 :
         dias <= 360 ? 0.20  :
         dias <= 720 ? 0.175 : 0.15;
}

// Busca CDI anual no Banco Central
async function cdiAtual() {
  try {
    const r = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs/12/dados?formato=json'
    );
    const j = await r.json();

    // Converte CDI diário em anual
    let acumulado = 1;
    j.slice(-252).forEach(d => {
      acumulado *= 1 + parseFloat(d.valor.replace(',', '.')) / 100;
    });

    el('cdi').value = ((acumulado - 1) * 100).toFixed(2).replace('.', ',');
  } catch {
    // falha silenciosa, usuário pode preencher manualmente
  }
}

// Validação obrigatória e > 0
function validar() {
  let ok = true;

  [
    ['valor', 'eValor'],
    ['desconto', 'eDesc'],
    ['parcelas', 'eParc'],
    ['cdi', 'eCdi'],
    ['percCdi', 'ePerc']
  ].forEach(([campo, erro]) => {
    if (num(el(campo).value) <= 0) {
      el(erro).style.display = 'block';
      ok = false;
    } else {
      el(erro).style.display = 'none';
    }
  });

  return ok;
}

// Cálculo principal
function calcular() {
  if (!validar()) return;

  const valor = num(el('valor').value);
  const desconto = num(el('desconto').value) / 100;
  const parcelas = num(el('parcelas').value);
  const cdi = num(el('cdi').value) / 100;
  const percCdi = num(el('percCdi').value) / 100;

  const valorVista = valor * (1 - desconto);

  // Taxa mensal equivalente
  const taxaMensal = Math.pow(1 + cdi * percCdi, 1 / 12) - 1;

  let saldo = valor;
  let rendimentoTotal = 0;
  let tabela = '';

  for (let m = 1; m <= parcelas; m++) {
    let rendimento = saldo * taxaMensal;
    rendimentoTotal += rendimento;
    saldo = saldo + rendimento - valor / parcelas;

    tabela += `
      <tr>
        <td>${m}</td>
        <td>R$ ${moeda(rendimento)}</td>
        <td>R$ ${moeda(valor / parcelas)}</td>
        <td>R$ ${moeda(saldo)}</td>
      </tr>`;
  }

  // Aplica IR apenas sobre rendimentos
  const irpf = rendimentoTotal * ir(parcelas * 30);
  const custoParcelado = valor - (saldo - irpf);

  el('veredicto').innerHTML =
    (custoParcelado < valorVista
      ? 'Parcelar seria melhor'
      : 'Pagar à vista seria melhor') +
    `<br>• À vista: R$ ${moeda(valorVista)}
     <br>• Parcelado (líquido): R$ ${moeda(custoParcelado)}`;

  el('p2').innerHTML = `
    <strong>Detalhamento dos rendimentos</strong>
    <table>
      <tr>
        <th>Mês</th>
        <th>Rendimento</th>
        <th>Parcela</th>
        <th>Saldo final</th>
      </tr>
      ${tabela}
    </table>`;
}

// Inicializações
maskMoney(el('valor'));
maskDec(el('desconto'));
maskDec(el('parcelas'));
maskDec(el('cdi'));
maskDec(el('percCdi'));

el('btnCalc').onclick = calcular;
el('btnLimpar').onclick = () => location.reload();
el('btnCdi').onclick = cdiAtual;
el('btnInfo').onclick = () =>
  el('explicacao').style.display =
    el('explicacao').style.display === 'none' ? 'block' : 'none';

window.onload = cdiAtual;
