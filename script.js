const el=id=>document.getElementById(id);
const num=v=>parseFloat(v.replace(/[^0-9.,]/g,'').replace(',','.'))||0;
const moeda=v=>v.toFixed(2).replace('.',',');

function maskMoney(i){i.addEventListener('input',()=>{let v=i.value.replace(/\D/g,'');i.value=(v/100).toFixed(2).replace('.',',')})}
function maskDec(i){i.addEventListener('input',()=>{i.value=i.value.replace(/[^0-9.,]/g,'')})}

function ir(d){return d<=180?.225:d<=360?.2:d<=720?.175:.15}

async function cdiAtual(){try{const r=await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs/12/dados?formato=json');const j=await r.json();let a=1;j.slice(-252).forEach(d=>a*=1+parseFloat(d.valor.replace(',','.'))/100);el('cdi').value=((a-1)*100).toFixed(2).replace('.',',')}catch{}}

function validar(){let ok=true;[['valor','eValor'],['desconto','eDesc'],['parcelas','eParc'],['cdi','eCdi'],['percCdi','ePerc']].forEach(([c,e])=>{if(num(el(c).value)<=0){el(e).style.display='block';ok=false}else el(e).style.display='none'});return ok}

function calcular(){if(!validar())return;const v=num(el('valor').value);const d=num(el('desconto').value)/100;const p=num(el('parcelas').value);const c=num(el('cdi').value)/100;const pc=num(el('percCdi').value)/100;const vista=v*(1-d);const tm=Math.pow(1+c*pc,1/12)-1;let s=v,rTot=0,t='';for(let m=1;m<=p;m++){let r=s*tm;rTot+=r;s=s+r-v/p;t+=`<tr><td>${m}</td><td>R$ ${moeda(s+r-v/p)}</td><td>R$ ${moeda(r)}</td><td>R$ ${moeda(v/p)}</td><td>R$ ${moeda(s)}</td></tr>`}
const irv=rTot*ir(p*30);const custo=v-(s-irv);
el('veredicto').innerHTML=(custo<vista?'Parcelar seria melhor':'À vista seria melhor')+`<br>• À vista: R$ ${moeda(vista)}<br>• Parcelado: R$ ${moeda(custo)}`;
el('p1').innerHTML=`<strong>Possibilidade 1</strong><br>R$ ${moeda(vista)}`;
el('p2').innerHTML=`<strong>Possibilidade 2</strong><br><table><tr><th>Mês</th><th>Saldo</th><th>Rend.</th><th>Parcela</th><th>Final</th></tr>${t}</table>`}

maskMoney(el('valor'));maskDec(el('desconto'));maskDec(el('parcelas'));maskDec(el('cdi'));maskDec(el('percCdi'));
el('btnCalc').onclick=calcular;el('btnLimpar').onclick=()=>location.reload();el('btnCdi').onclick=cdiAtual;el('btnInfo').onclick=()=>el('explicacao').style.display=el('explicacao').style.display==='none'?'block':'none';window.onload=cdiAtual;
