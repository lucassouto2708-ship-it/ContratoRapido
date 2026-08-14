/* ---------- número por extenso (pt-BR) ---------- */

const UNIDADES = ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove'];
const DEZ_A_DEZENOVE = ['dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
const DEZENAS = ['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
const CENTENAS = ['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];

function tresDigitosPorExtenso(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes = [];
  if (c > 0) partes.push(CENTENAS[c]);
  if (r > 0) {
    if (r < 10) partes.push(UNIDADES[r]);
    else if (r < 20) partes.push(DEZ_A_DEZENOVE[r - 10]);
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      partes.push(u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${UNIDADES[u]}`);
    }
  }
  return partes.join(' e ');
}

function numeroPorExtenso(n) {
  n = Math.floor(n);
  if (n === 0) return 'zero';
  const milhoes = Math.floor(n / 1000000);
  const milhares = Math.floor((n % 1000000) / 1000);
  const unidades = n % 1000;

  const grupos = [];
  if (milhoes > 0) grupos.push(milhoes === 1 ? 'um milhão' : `${tresDigitosPorExtenso(milhoes)} milhões`);
  if (milhares > 0) grupos.push(milhares === 1 ? 'mil' : `${tresDigitosPorExtenso(milhares)} mil`);
  if (unidades > 0) grupos.push(tresDigitosPorExtenso(unidades));

  if (grupos.length === 1) return grupos[0];
  const ultimo = grupos.pop();
  return `${grupos.join(', ')} e ${ultimo}`;
}

function formatarValorExtenso(valorStr) {
  const valorNum = parseFloat(String(valorStr).replace(/\./g, '').replace(',', '.'));
  const inteiro = Math.floor(valorNum);
  const centavos = Math.round((valorNum - inteiro) * 100);
  const partes = [`${numeroPorExtenso(inteiro)} ${inteiro === 1 ? 'real' : 'reais'}`];
  if (centavos) {
    partes.push(`${numeroPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  }
  return partes.join(' e ');
}

/* ---------- datas ---------- */

const MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function formatarDataAssinatura(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  return `${String(dia).padStart(2, '0')} de ${MESES_PT[mes - 1]}`;
}

const DATA_FIM_PADRAO = '04.10.2026';
const TEXTO_VIGENCIA_CAMPANHA = 'o encerramento do período da campanha eleitoral';

function dataParaIso(valor) {
  if (valor instanceof Date) {
    return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`;
  }
  const texto = String(valor || '').trim();
  let m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  throw new Error(`data inválida: '${texto}' (use o formato DD/MM/AAAA)`);
}

/* ---------- nome de arquivo ---------- */

function slugifyNomeArquivo(texto) {
  return texto
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, ' ');
}

/* ---------- contexto do contrato (mesmas regras do painel anterior) ---------- */

function montarContexto(c) {
  const periodicidade = c.periodicidade || 'mensal';
  const isoData = dataParaIso(c.data_assinatura);
  return {
    contexto: {
      nome: (c.nome || '').trim(),
      local_prestacao: (c.local_prestacao || '').trim(),
      cpf: (c.cpf || '').trim(),
      rg: (c.rg || '').trim(),
      titulo_eleitor: (c.titulo_eleitor || '').trim(),
      endereco_contratado: (c.endereco_contratado || '').trim(),
      horario_semanal: (c.horario_semanal || '').trim(),
      horario_fds: (c.horario_fds || '').trim(),
      valor: (c.valor || '').trim(),
      valor_extenso: formatarValorExtenso(c.valor),
      marca_diario: periodicidade === 'diario' ? 'X' : '',
      marca_semanal: periodicidade === 'semanal' ? 'X' : '',
      marca_mensal: periodicidade === 'mensal' ? 'X' : '',
      chave_pix: (c.chave_pix || '').trim(),
      banco: (c.banco || '').trim(),
      conta_corrente: (c.conta_corrente || '').trim(),
      agencia: (c.agencia || '').trim(),
      titular_conta: (c.titular_conta || '').trim(),
      data_assinatura: formatarDataAssinatura(isoData),
      data_fim: c.periodo_campanha ? TEXTO_VIGENCIA_CAMPANHA : DATA_FIM_PADRAO,
    },
    dataIso: isoData,
  };
}

/* ---------- geração do docx (docxtemplater + pizzip) ---------- */

let modeloArrayBuffer = null;

async function carregarModelo() {
  if (modeloArrayBuffer) return modeloArrayBuffer;
  const resp = await fetch('modelo/modelo_contrato.docx');
  if (!resp.ok) throw new Error('Não foi possível carregar o modelo do contrato (modelo/modelo_contrato.docx).');
  modeloArrayBuffer = await resp.arrayBuffer();
  return modeloArrayBuffer;
}

async function gerarDocxBlob(contexto) {
  const buffer = await carregarModelo();
  const zip = new PizZip(buffer);
  const doc = new window.docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    parser: function (tag) {
      const chave = tag.trim();
      return { get: function (scope) { return scope ? scope[chave] : undefined; } };
    },
  });
  try {
    doc.render(contexto);
  } catch (e) {
    const detalhe = (e.properties && e.properties.errors)
      ? e.properties.errors.map(err => err.properties?.explanation || err.message).join('; ')
      : e.message;
    throw new Error(`Falha ao preencher o modelo: ${detalhe}`);
  }
  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/* ---------- montagem dos horários (igual à versão anterior) ---------- */

function montarHorarioSemanal(b) {
  const get = (sel) => b.querySelector(sel).value.trim();
  const entrada = get('.sem_entrada');
  const saida = get('.sem_saida');
  const intervalo = get('.sem_intervalo');
  if (!entrada || !saida) return '';
  let txt = `${entrada} horas às ${saida} horas`;
  if (intervalo) txt += `, com ${intervalo} hora${intervalo == 1 ? '' : 's'} de intervalo para refeições`;
  return txt;
}

function montarHorarioFds(b) {
  const get = (sel) => b.querySelector(sel).value.trim();
  const dias = get('.fds_dias') || 'sábados';
  const entrada = get('.fds_entrada');
  const saida = get('.fds_saida');
  const horas = get('.fds_horas');
  if (!entrada || !saida) return '';
  let txt = `${dias}`;
  if (horas) txt += ` por ${horas} horas`;
  txt += `, das ${entrada} horas às ${saida} horas`;
  return txt;
}

/* ---------- formulário manual ---------- */

let contador = 0;

function atualizarEmptyState() {
  const lista = document.getElementById('lista');
  const empty = document.getElementById('empty-state');
  empty.style.display = lista.children.length === 0 ? 'block' : 'none';
}

function adicionarContrato() {
  contador++;
  const tpl = document.getElementById('tpl-contrato');
  const clone = tpl.content.cloneNode(true);
  clone.querySelector('.indice').textContent = '#' + contador;
  clone.querySelectorAll('input[type=radio]').forEach(r => r.name = 'periodicidade_' + contador);

  const nomeInput = clone.querySelector('.nome');
  const preview = clone.querySelector('.nome-preview');
  nomeInput.addEventListener('input', () => {
    const v = nomeInput.value.trim();
    preview.textContent = v || 'sem nome ainda';
    preview.classList.toggle('vazio', !v);
  });

  document.getElementById('lista').appendChild(clone);
  atualizarEmptyState();
}

function removerContrato(botao) {
  botao.closest('.contrato').remove();
  atualizarEmptyState();
}

function coletarDados() {
  const blocos = document.querySelectorAll('#lista .contrato');
  const contratos = [];
  for (const b of blocos) {
    const get = (sel) => b.querySelector(sel).value.trim();
    const periodicidade = b.querySelector('input[type=radio]:checked')?.value || 'mensal';
    contratos.push({
      nome: get('.nome'),
      local_prestacao: get('.local_prestacao'),
      cpf: get('.cpf'),
      rg: get('.rg'),
      titulo_eleitor: get('.titulo_eleitor'),
      endereco_contratado: get('.endereco_contratado'),
      data_assinatura: get('.data_assinatura'),
      periodo_campanha: b.querySelector('.periodo_campanha').checked,
      valor: get('.valor'),
      periodicidade: periodicidade,
      horario_semanal: montarHorarioSemanal(b),
      horario_fds: montarHorarioFds(b),
      chave_pix: get('.chave_pix'),
      banco: get('.banco'),
      agencia: get('.agencia'),
      conta_corrente: get('.conta_corrente'),
      titular_conta: get('.titular_conta'),
    });
  }
  return contratos;
}

function validar(contratos) {
  const obrigatorios = ['nome','local_prestacao','cpf','rg','titulo_eleitor','endereco_contratado','data_assinatura','valor','horario_semanal','horario_fds'];
  const nomes = {
    horario_semanal: 'horário de segunda a sábado', horario_fds: 'horário de fim de semana',
    local_prestacao: 'local de prestação do serviço', titulo_eleitor: 'título de eleitor',
    endereco_contratado: 'endereço do contratado',
  };
  for (const c of contratos) {
    for (const campo of obrigatorios) {
      if (!c[campo]) return `Preencha o campo "${nomes[campo] || campo}" para o contrato de "${c.nome || 'sem nome'}".`;
    }
  }
  return null;
}

/* ---------- UI: avisos / loading / resultado ---------- */

function mostrarAviso(mensagem) {
  const area = document.getElementById('aviso-area');
  if (!mensagem) { area.innerHTML = ''; return; }
  area.innerHTML = `<div class="alerta erro"><span class="marca">!</span><span>${mensagem}</span></div>`;
}

function mostrarCarregando(mensagem) {
  document.getElementById('resultado-area').innerHTML =
    `<div class="loading-box"><span class="spinner" style="border-top-color:var(--accent); border-color:var(--border);"></span>${mensagem}</div>`;
}

function renderizarResultado(gerados) {
  const area = document.getElementById('resultado-area');
  area.innerHTML = '';

  const falhas = gerados.filter(g => !g.ok).length;
  const header = document.createElement('div');
  header.className = 'resultado-header' + (falhas ? ' com-erro' : '');
  header.innerHTML = `<span class="ponto"></span><span>${gerados.length} contrato${gerados.length > 1 ? 's' : ''} processado${gerados.length > 1 ? 's' : ''}${falhas ? `, ${falhas} com falha` : ' — download iniciado automaticamente'}</span>`;
  area.appendChild(header);

  gerados.forEach((g, i) => {
    const div = document.createElement('div');
    div.className = 'card-resultado' + (!g.ok ? ' falhou' : '');
    div.style.animationDelay = (i * 40) + 'ms';
    const status = g.ok ? 'Word gerado' : `<span class="erro">${g.erro}</span>`;
    div.innerHTML = `<span class="nome">${g.nome}</span><span class="status">${status}</span>`;
    area.appendChild(div);
  });
}

/* ---------- geração (manual) ---------- */

async function gerarContratos() {
  mostrarAviso('');
  document.getElementById('resultado-area').innerHTML = '';

  const contratos = coletarDados();
  if (contratos.length === 0) {
    mostrarAviso('Adicione ao menos um contrato antes de gerar.');
    return;
  }
  const erro = validar(contratos);
  if (erro) {
    mostrarAviso(erro);
    return;
  }

  await processarEGerar(contratos);
}

async function processarEGerar(contratosBrutos) {
  const btn = document.getElementById('btn-gerar');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>Gerando...`; }
  mostrarCarregando(`Gerando ${contratosBrutos.length} contrato${contratosBrutos.length > 1 ? 's' : ''}, aguarde...`);

  const gerados = [];
  const arquivosParaZip = [];

  for (const c of contratosBrutos) {
    const nomeExibicao = c.nome || '(sem nome)';
    try {
      const { contexto, dataIso } = montarContexto(c);
      const blob = await gerarDocxBlob(contexto);
      const [ano, mes, dia] = dataIso.split('-');
      const nomeArquivo = `${slugifyNomeArquivo(contexto.nome)} - ${dia}-${mes}-${ano}.docx`;
      gerados.push({ nome: nomeExibicao, ok: true });
      arquivosParaZip.push({ nomeArquivo, blob });
    } catch (e) {
      gerados.push({ nome: nomeExibicao, ok: false, erro: e.message });
    }
  }

  renderizarResultado(gerados);

  if (arquivosParaZip.length === 1) {
    baixarBlob(arquivosParaZip[0].blob, arquivosParaZip[0].nomeArquivo);
  } else if (arquivosParaZip.length > 1) {
    const zip = new JSZip();
    arquivosParaZip.forEach(a => zip.file(a.nomeArquivo, a.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const agora = new Date();
    const carimbo = `${agora.getFullYear()}${String(agora.getMonth()+1).padStart(2,'0')}${String(agora.getDate()).padStart(2,'0')}_${String(agora.getHours()).padStart(2,'0')}${String(agora.getMinutes()).padStart(2,'0')}`;
    baixarBlob(zipBlob, `contratos_${carimbo}.zip`);
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Gerar Word'; }
}

function baixarBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- planilha: modelo para download ---------- */

const CABECALHOS_PLANILHA = [
  'Nome completo do(a) contratado(a)', 'Local de prestação do serviço', 'CPF', 'RG',
  'Título de eleitor', 'Endereço do contratado', 'Data da assinatura (DD/MM/AAAA)',
  'Vigência = todo o período da campanha? (sim/não)',
  'Valor (R$)', 'Periodicidade (diario, semanal ou mensal)',
  'Horário de entrada (seg a sáb)', 'Horário de saída (seg a sáb)', 'Intervalo em horas (seg a sáb)',
  'Dias de fim de semana (ex: sábados)', 'Horário de entrada (fim de semana)', 'Horário de saída (fim de semana)',
  'Total de horas (fim de semana)', 'Chave PIX', 'Banco', 'Agência', 'Conta corrente', 'Titular da conta',
];

const LINHA_EXEMPLO = [
  'Maria Aparecida Souza', 'Governador Valadares', '123.456.789-00', 'MG-12.345.678',
  '123456789012', 'Rua Exemplo, 100, Centro, Governador Valadares/MG',
  '06/08/2026', 'não', '1500,00', 'mensal',
  '08:00', '17:00', '1',
  'sábados', '09:00', '15:00', '6',
  '11122233344', 'Banco do Brasil', '1234', '12345-6', 'Maria Aparecida Souza',
];

const COLUNAS_PLANILHA = [
  'nome', 'local_prestacao', 'cpf', 'rg', 'titulo_eleitor', 'endereco_contratado',
  'data_assinatura', 'periodo_campanha', 'valor', 'periodicidade',
  'sem_entrada', 'sem_saida', 'sem_intervalo',
  'fds_dias', 'fds_entrada', 'fds_saida', 'fds_horas',
  'chave_pix', 'banco', 'agencia', 'conta_corrente', 'titular_conta',
];

function baixarModeloPlanilha() {
  const ws = XLSX.utils.aoa_to_sheet([CABECALHOS_PLANILHA, LINHA_EXEMPLO]);
  ws['!cols'] = [28, 22, 16, 16, 16, 30, 22, 22, 12, 26, 14, 14, 14, 18, 16, 16, 14, 22, 20, 12, 16, 26].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contratos');
  XLSX.writeFile(wb, 'modelo_planilha_contratos.xlsx');
}

/* ---------- planilha: upload em massa ---------- */

function valorCelula(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function parseHoraCelula(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) {
    // célula de hora nativa do Excel: SheetJS converte para Date no horário local
    return `${String(v.getHours()).padStart(2,'0')}:${String(v.getMinutes()).padStart(2,'0')}`;
  }
  if (typeof v === 'number') {
    // fração do dia (formato hora nativo do Excel)
    const totalMin = Math.round(v * 24 * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  let texto = String(v).trim().replace(/h/gi, ':');
  const m = texto.match(/^(\d{1,2}):?(\d{2})?$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const mi = parseInt(m[2] || '0', 10);
    return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
  }
  return texto;
}

function normalizarPeriodicidade(v) {
  const texto = String(v || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (texto.startsWith('diari')) return 'diario';
  if (texto.startsWith('semanal')) return 'semanal';
  return 'mensal';
}

function linhaParaContrato(valores) {
  const dados = {};
  COLUNAS_PLANILHA.forEach((col, i) => dados[col] = valores[i]);

  const semEntrada = parseHoraCelula(dados.sem_entrada);
  const semSaida = parseHoraCelula(dados.sem_saida);
  const semIntervalo = valorCelula(dados.sem_intervalo);
  let horarioSemanal = `${semEntrada} horas às ${semSaida} horas`;
  if (semIntervalo) {
    horarioSemanal += `, com ${semIntervalo} hora${['1','1.0'].includes(semIntervalo) ? '' : 's'} de intervalo para refeições`;
  }

  const fdsDias = valorCelula(dados.fds_dias) || 'sábados';
  const fdsEntrada = parseHoraCelula(dados.fds_entrada);
  const fdsSaida = parseHoraCelula(dados.fds_saida);
  const fdsHoras = valorCelula(dados.fds_horas);
  let horarioFds = fdsDias;
  if (fdsHoras) horarioFds += ` por ${fdsHoras} horas`;
  horarioFds += `, das ${fdsEntrada} horas às ${fdsSaida} horas`;

  let dataAssinatura;
  if (dados.data_assinatura instanceof Date) {
    dataAssinatura = dados.data_assinatura;
  } else {
    dataAssinatura = valorCelula(dados.data_assinatura);
  }

  const periodoCampanhaTexto = String(dados.periodo_campanha || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const periodoCampanha = ['sim', 's', 'x', 'true', '1'].includes(periodoCampanhaTexto);

  return {
    nome: valorCelula(dados.nome),
    local_prestacao: valorCelula(dados.local_prestacao),
    cpf: valorCelula(dados.cpf),
    rg: valorCelula(dados.rg),
    titulo_eleitor: valorCelula(dados.titulo_eleitor),
    endereco_contratado: valorCelula(dados.endereco_contratado),
    data_assinatura: dataAssinatura,
    periodo_campanha: periodoCampanha,
    valor: valorCelula(dados.valor),
    periodicidade: normalizarPeriodicidade(dados.periodicidade),
    horario_semanal: horarioSemanal,
    horario_fds: horarioFds,
    chave_pix: valorCelula(dados.chave_pix),
    banco: valorCelula(dados.banco),
    agencia: valorCelula(dados.agencia),
    conta_corrente: valorCelula(dados.conta_corrente),
    titular_conta: valorCelula(dados.titular_conta),
  };
}

async function enviarPlanilha(arquivo) {
  const inputPlanilha = document.getElementById('input-planilha');
  if (!arquivo) return;

  mostrarAviso('');
  mostrarCarregando('Lendo planilha, aguarde...');

  try {
    const buffer = await arquivo.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

    const contratos = [];
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];
      if (!linha || !valorCelula(linha[0])) continue;
      contratos.push(linhaParaContrato(linha));
    }

    if (contratos.length === 0) {
      document.getElementById('resultado-area').innerHTML = '';
      mostrarAviso('Nenhuma linha com dados válidos foi encontrada na planilha.');
      return;
    }

    await processarEGerar(contratos);
  } catch (e) {
    document.getElementById('resultado-area').innerHTML = '';
    mostrarAviso('Erro ao processar a planilha: ' + e.message);
  } finally {
    inputPlanilha.value = '';
  }
}

adicionarContrato();
