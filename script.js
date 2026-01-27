async function carregarCDI() {
  try {
    const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json');
    const data = await response.json();
    document.getElementById('cdi').value = data[0].valor.replace('.', ',') + ' %';
  } catch {
    document.getElementById('cdi').value = 'CDI indisponível';
  }
}

carregarCDI();

function limparNumero(valor) {
  return parseFloat(valor.replace(/[R$ %]/g, '').replace(',', '.')) || 0;
}

function calcular() {
  const valorCompra = limparNumero(document.getElementById('valorCompra').value);
  const desconto = limparNumero(document.getElementById('desconto').value) / 100;
  const parcelas = parseInt(document.getElementById('parcelas').value);
  const cdi = limparNumero(document.getElementById('cdi').value) / 100;
  const percentualCdi = limparNumero(document.getElementById('percentualCdi').value) / 100;

  if (!valorCompra || !parcelas) return;

  const valorVista = valorCompra * (1 - desconto);

  const taxaMensal = Math.pow(1 + cdi * percentualCdi, 1 / 12) - 1;
  const parcela = valorCompra / parcelas;

  let saldo = valorCompra;
  let rendimento = 0;

  for (let i = 0; i < parcelas; i++) {
    const ganho = saldo * taxaMensal;
    rendimento += ganho;
    saldo = saldo + ganho - parcela;
  }

  const custoParcelado = valorCompra - saldo;

  let texto = '';
  if (custoParcelado < valorVista) {
    texto = 'Parcelar foi melhor porque o dinheiro guardado cresceu enquanto você pagava as parcelas.';
  } else {
    texto = 'Pagar à vista foi melhor porque o desconto foi maior do que o dinheiro que renderia guardado.';
  }

  document.getElementById('veredicto').innerHTML =
    '<strong>Resultado</strong><br>' +
    texto +
    '<br><br>' +
    'À vista: você paga R$ ' + valorVista.toFixed(2) +
    '<br>Parcelado: no fim você gastou R$ ' + custoParcelado.toFixed(2);

  document.getElementById('possibilidadeVista').innerHTML =
    '<strong>Possibilidade 1</strong><br>Pagamento à vista com desconto de R$ ' +
    valorVista.toFixed(2);

  document.getElementById('possibilidadeParcelado').innerHTML =
    '<strong>Possibilidade 2</strong><br>Parcelamento com aplicação e saldo final de R$ ' +
    saldo.toFixed(2);
}
