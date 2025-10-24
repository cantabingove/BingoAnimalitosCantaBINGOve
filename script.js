document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 Iniciando aplicación...');
  // === CONFIGURACIÓN ===
  const COSTO_POR_JUGADA = 30;
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwq5S5MWDbrN1P7MAD25b36c0jk7m9CQudCKR4-0-uNvvXH9nsoZot15b0YiSMNGJTj/exec';
  const HORA_INICIO = '00:00:01';
  const HORA_FIN = '20:30:01';
  // =====================

  const elementos = {
    formularioContainer: document.getElementById('formularioContainer'),
    paginaResumen: document.getElementById('paginaResumen'),
    grilla: document.getElementById('grillaAnimalitos'),
    cartonJugada: document.getElementById('cartonJugada'),
    resumenJugadas: document.getElementById('resumenJugadas'),
    contador: document.getElementById('contador'),
    contadorJugadas: document.getElementById('contadorJugadas'),
    textoContador: document.getElementById('textoContador'),
    nombreInput: document.getElementById('nombre'),
    telefonoInput: document.getElementById('telefono'),
    referenciaInput: document.getElementById('referencia'),
    montoInput: document.getElementById('montoPagado'),
    btnEnviar: document.getElementById('btnEnviar'),
    formulario: document.getElementById('formularioJugada'),
    btnContinuar: document.getElementById('btnContinuar'),
    btnDescargarPDFResumen: document.getElementById('btnDescargarPDFResumen'),
    progresoBar: document.getElementById('progresoBar'),
    horaVenezuela: document.getElementById('horaVenezuela')
  };

  let jugadasEnviadas = 0;
  let maxJugadasPermitidas = 0;
  let seleccionados = [];
  let jugadasActuales = [];
  let montoTotal = 0;
  let enviandoJugada = false;

  const emojis = ['🐶', '🐱', '🐹', '🐰', '🐭', '🦊', '🐬', '🐼', '🐘', '🐯', '🦁', '🐮', '🐷', '🦓', '🐵', '🐔', '🐢', '🐓', '🦆', '🦅', '🦉', '🐊', '🐺', '🦀', '🐴'];
  const nombres = ["Perro", "Gato", "Hamster", "Conejo", "Capibara", "Zorro", "Delfín", "Panda", "Elefante", "Tigre", "León", "Vaca", "Cerdo", "Cebra", "Mono", "Gallina", "Tortuga", "Gallo", "Pato", "Águila", "Búho", "Caimán", "Lobo", "Cangrejo", "Caballo"];

  // ========== HORARIO VENEZUELA ==========
  function obtenerHoraVenezuela() {
    const ahora = new Date();
    const offsetVenezuela = -4 * 60;
    const offsetLocal = ahora.getTimezoneOffset();
    const diffMinutos = offsetLocal - offsetVenezuela;
    return new Date(ahora.getTime() + diffMinutos * 0);
  }

  function estaEnHorarioPermitido() {
    const horaVenezuela = obtenerHoraVenezuela();
    const horaActual = horaVenezuela.toTimeString().split(' ')[0];
    return horaActual >= HORA_INICIO && horaActual <= HORA_FIN;
  }

  function obtenerMensajeHorario() {
    const enHorario = estaEnHorarioPermitido();
    const horaVenezuela = obtenerHoraVenezuela();
    const horaFormateada = horaVenezuela.toTimeString().split(' ')[0];
    if (!enHorario) {
      return `⏰ Fuera de horario (${horaFormateada} VET). Recepción: ${HORA_INICIO} - ${HORA_FIN} VET`;
    }
    return null;
  }

  function mostrarHoraVenezuela() {
    const horaVenezuela = obtenerHoraVenezuela();
    const opciones = { timeZone: 'America/Caracas', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const horaFormateada = horaVenezuela.toLocaleTimeString('es-VE', opciones);
    if (elementos.horaVenezuela) {
      elementos.horaVenezuela.textContent = `Hora Venezuela: ${horaFormateada} VET`;
    }
  }

  // ========== FUNCIONES PRINCIPALES ==========
  function calcularJugadasPermitidas() {
    const valor = elementos.montoInput.value.trim();
    if (valor === '') {
      maxJugadasPermitidas = 0;
      elementos.textoContador.textContent = 'Ingresa tu monto para comenzar';
      elementos.btnEnviar.disabled = true;
      actualizarBarraProgreso();
      return;
    }
    const monto = parseFloat(valor);
    if (isNaN(monto) || monto < COSTO_POR_JUGADA) {
      maxJugadasPermitidas = 0;
      elementos.textoContador.textContent = `Monto mínimo: $${COSTO_POR_JUGADA}`;
      elementos.btnEnviar.disabled = true;
    } else if (monto % COSTO_POR_JUGADA !== 0) {
      maxJugadasPermitidas = 0;
      elementos.textoContador.textContent = `El monto debe ser múltiplo de $${COSTO_POR_JUGADA}`;
      elementos.btnEnviar.disabled = true;
    } else {
      maxJugadasPermitidas = monto / COSTO_POR_JUGADA;
      montoTotal = monto;
      actualizarContadorJugadas();
    }
    actualizarBarraProgreso();
  }

  function actualizarBarraProgreso() {
    if (!elementos.progresoBar) return;
    const progreso = maxJugadasPermitidas > 0 ? (jugadasEnviadas / maxJugadasPermitidas) * 100 : 0;
    elementos.progresoBar.style.width = `${progreso}%`;
    if (progreso === 100) {
      elementos.contadorJugadas.classList.add('contador-completado');
    } else if (progreso > 0) {
      elementos.contadorJugadas.classList.add('contador-progreso');
    } else {
      elementos.contadorJugadas.classList.remove('contador-progreso', 'contador-completado');
    }
  }

  function actualizarContadorJugadas() {
    const mensajeHorario = obtenerMensajeHorario();
    if (mensajeHorario) {
      elementos.textoContador.textContent = mensajeHorario;
      elementos.textoContador.style.color = '#d32f2f';
      return;
    }
    elementos.textoContador.style.color = '';
    if (maxJugadasPermitidas === 0) {
      elementos.textoContador.textContent = 'Ingresa tu monto para comenzar';
    } else if (jugadasEnviadas < maxJugadasPermitidas) {
      elementos.textoContador.textContent = `Jugada ${jugadasEnviadas + 1} de ${maxJugadasPermitidas}`;
    } else {
      elementos.textoContador.textContent = '¡Todas las jugadas completadas!';
    }
    actualizarBarraProgreso();
  }

  function toggleSeleccion(numero) {
    const index = seleccionados.indexOf(numero);
    if (index !== -1) {
      seleccionados.splice(index, 1);
      elementos.grilla.querySelector(`[data-numero="${numero}"]`).classList.remove('seleccionado');
    } else {
      if (seleccionados.length >= 15) {
        alert('Ya seleccionaste 15 números. Deselecciona uno para cambiar.');
        return;
      }
      seleccionados.push(numero);
      elementos.grilla.querySelector(`[data-numero="${numero}"]`).classList.add('seleccionado');
    }
    actualizarCarton();
    validarFormulario();
  }

  function actualizarCarton() {
    elementos.cartonJugada.innerHTML = '';
    seleccionados.forEach(num => {
      const casilla = document.createElement('div');
      casilla.className = 'casilla-jugada';
      casilla.dataset.numero = num;
      const img = document.createElement('img');
      img.src = `images/${num}.png`;
      img.alt = nombres[num - 1];
      img.className = 'imagen-carton';
      const casillaRef = casilla;
      img.onerror = function() {
        this.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'texto-carton';
        fallback.innerHTML = `
          <div class="emoji-carton">${emojis[num - 1]}</div>
          ${nombres[num - 1]}<br>
          <small>${num}</small>
        `;
        casillaRef.appendChild(fallback);
      };
      img.onload = function() {
        casillaRef.appendChild(img);
      };
      elementos.cartonJugada.appendChild(casilla);
    });
    elementos.contador.textContent = `(${seleccionados.length} / 15)`;
  }

  function validarFormulario() {
    const nombre = elementos.nombreInput.value.trim();
    const telefono = elementos.telefonoInput.value;
    const referencia = elementos.referenciaInput.value;
    const nombreValido = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{1,25}$/.test(nombre);
    const telefonoValido = /^[\d+]{10,15}$/.test(telefono);
    const referenciaValida = /^\d{4}$/.test(referencia);
    const montoValido = maxJugadasPermitidas > 0;
    const puedeJugar = jugadasEnviadas < maxJugadasPermitidas;
    const seleccionCompleta = seleccionados.length === 15;
    const mensajeHorario = obtenerMensajeHorario();
    const enHorarioPermitido = mensajeHorario === null;

    if (mensajeHorario) {
      elementos.textoContador.textContent = mensajeHorario;
      elementos.textoContador.style.color = '#d32f2f';
      elementos.btnEnviar.disabled = true;
      return;
    }

    elementos.btnEnviar.disabled = !(
      nombreValido && 
      telefonoValido && 
      referenciaValida && 
      montoValido && 
      puedeJugar && 
      seleccionCompleta
    ) || enviandoJugada;
  }

  function prepararEnvio() {
    enviandoJugada = true;
    elementos.btnEnviar.disabled = true;
    elementos.btnEnviar.classList.add('procesando');
    elementos.btnEnviar.textContent = '🔄 Enviando...';
  }

  function finalizarEnvio() {
    enviandoJugada = false;
    elementos.btnEnviar.classList.remove('procesando');
    elementos.btnEnviar.textContent = 'Enviar Jugada';
    validarFormulario();
  }

  function formatearReferencia(referencia) {
    return referencia.padStart(4, '0');
  }

  // ✅ FUNCIÓN JSONP: SIN CORS, SIN FETCH
  function guardarJugada(jugada) {
    return new Promise((resolve, reject) => {
      const referenciaFormateada = jugada.referencia.padStart(4, '0');
      const telefonoFormateado = jugada.telefono.toString();
      const animalitosStr = jugada.animalitos.join(',');
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      window[callbackName] = function(response) {
        document.head.removeChild(script);
        delete window[callbackName];
        if (response.status === 'success') {
          const numeroJugada = jugadasActuales.length + 1; // ✅ CORRECCIÓN CLAVE
          const jugadaLocal = {
            nombre: jugada.nombre,
            telefono: telefonoFormateado,
            referencia: referenciaFormateada,
            animalitos: [...jugada.animalitos],
            fecha: jugada.fecha || new Date().toISOString(),
            confirmado: true,
            timestampServidor: response.timestamp,
            numeroJugada: numeroJugada // ✅ AHORA SÍ ESTÁ DEFINIDO
          };
          jugadasActuales.push(jugadaLocal);
          resolve(jugadaLocal);
        } else {
          reject(new Error(response.message || 'Error del servidor'));
        }
      };
      const params = new URLSearchParams({
        callback: callbackName,
        nombre: jugada.nombre || '',
        telefono: telefonoFormateado,
        monto: COSTO_POR_JUGADA,
        referencia: referenciaFormateada,
        animalitos: animalitosStr,
        numeroJugada: jugadasActuales.length + 1
      });
      const script = document.createElement('script');
      script.src = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
      script.onerror = () => {
        document.head.removeChild(script);
        delete window[callbackName];
        reject(new Error('Error de red al conectar con el servidor'));
      };
      document.head.appendChild(script);
    });
  }

  function mostrarResumen() {
    if (jugadasActuales.some(j => !j.confirmado)) {
      alert('⚠️ Algunas jugadas no fueron confirmadas por el servidor. No se puede generar comprobante.');
      return;
    }
    elementos.resumenJugadas.innerHTML = '';
    if (jugadasActuales.length === 0) {
      elementos.resumenJugadas.innerHTML = '<p class="sin-jugadas">No hay jugadas para mostrar</p>';
      return;
    }
    const primeraJugada = jugadasActuales[0];
    const limpiarValor = (valor) => typeof valor === 'string' ? valor.replace(/[🔢📞]/g, '') : valor;
    const datosUsuario = document.createElement('div');
    datosUsuario.className = 'datos-usuario';
    datosUsuario.innerHTML = `
      <h3>Datos del Usuario</h3>
      <div class="datos-grid">
        <div class="dato-item">
          <strong>Nombre y Apellido:</strong>
          <span>${primeraJugada.nombre}</span>
        </div>
        <div class="dato-item">
          <strong>Teléfono:</strong>
          <span>${limpiarValor(primeraJugada.telefono)}</span>
        </div>
        <div class="dato-item">
          <strong>Monto Total Transferido:</strong>
          <span>$${montoTotal}</span>
        </div>
        <div class="dato-item">
          <strong>Referencia:</strong>
          <span>${limpiarValor(primeraJugada.referencia)}</span>
        </div>
        <div class="dato-item">
          <strong>Fecha:</strong>
          <span>${new Date(primeraJugada.fecha).toLocaleString()}</span>
        </div>
        <div class="dato-item">
          <strong>Costo por Jugada:</strong>
          <span>$${COSTO_POR_JUGADA}</span>
        </div>
        <div class="dato-item">
          <strong>Total de Jugadas:</strong>
          <span>${jugadasActuales.length}</span>
        </div>
      </div>
    `;
    elementos.resumenJugadas.appendChild(datosUsuario);

    const tabla = document.createElement('table');
    tabla.className = 'tabla-resumen';
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Jugada</th>
          <th>Animalitos</th>
        </tr>
      </thead>
      <tbody>
        ${jugadasActuales.map(jugada => `
          <tr>
            <td class="numero-jugada">${jugada.numeroJugada}</td>
            <td class="animalitos">${jugada.animalitos.join(', ')}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    elementos.resumenJugadas.appendChild(tabla);

    elementos.formularioContainer.style.display = 'none';
    elementos.paginaResumen.style.display = 'block';
    window.scrollTo(0, 0);
  }

  // ✅ FUNCIÓN REUTILIZABLE PARA GENERAR Y DESCARGAR PDF
  function generarYDescargarPDF() {
    if (jugadasActuales.some(j => !j.confirmado)) {
      console.warn('⚠️ No se puede generar PDF: jugadas no confirmadas');
      return;
    }
    if (jugadasActuales.length === 0) {
      console.warn('⚠️ No hay jugadas para generar PDF');
      return;
    }

    let jsPDF = window.jspdf.jsPDF;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(25, 118, 210);
      doc.text('COMPROBANTE DE JUGADAS - ANIMALITOS', 105, 20, { align: 'center' });

      const primeraJugada = jugadasActuales[0];
      const limpiarValor = (valor) => typeof valor === 'string' ? valor.replace(/[🔢📞]/g, '') : valor;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Nombre y Apellido: ${primeraJugada.nombre}`, 20, 40);
      doc.text(`Teléfono: ${limpiarValor(primeraJugada.telefono)}`, 20, 50);
      doc.text(`Monto Total Transferido: $${montoTotal}`, 20, 60);
      doc.text(`Referencia: ${limpiarValor(primeraJugada.referencia)}`, 20, 70);
      doc.text(`Costo por Jugada: $${COSTO_POR_JUGADA}`, 20, 80);
      doc.text(`Total de Jugadas: ${jugadasActuales.length}`, 20, 90);
      doc.text(`Fecha: ${new Date(primeraJugada.fecha).toLocaleString()}`, 20, 100);

      let yPosition = 120;
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('Jugadas Realizadas', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(25, 118, 210);
      doc.rect(20, yPosition, 170, 8, 'F');
      doc.text('Jugada', 25, yPosition + 6);
      doc.text('Animalitos', 60, yPosition + 6);
      yPosition += 12;

      doc.setTextColor(0, 0, 0);
      jugadasActuales.forEach(jugada => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        // ✅ Protección adicional por si numeroJugada no existe
        const numJugada = jugada.numeroJugada || (jugadasActuales.indexOf(jugada) + 1);
        doc.text(numJugada.toString(), 25, yPosition);
        const animalitosTexto = jugada.animalitos.join(', ');
        const animalitosLines = doc.splitTextToSize(animalitosTexto, 120);
        let lineHeight = yPosition;
        animalitosLines.forEach(line => {
          doc.text(line, 60, lineHeight);
          lineHeight += 5;
        });
        yPosition = lineHeight + 8;
      });

      const nombreArchivo = `comprobante_${limpiarValor(primeraJugada.referencia)}.pdf`;
      doc.save(nombreArchivo);
      console.log('📄 Comprobante descargado automáticamente:', nombreArchivo);
    } catch (error) {
      console.error('Error al generar comprobante automático:', error);
      alert('⚠️ No se pudo generar tu comprobante. Haz clic en "Descargar Comprobante" manualmente.');
    }
  }

  function resetearFormulario() {
    elementos.formulario.reset();
    seleccionados = [];
    jugadasEnviadas = 0;
    maxJugadasPermitidas = 0;
    jugadasActuales = [];
    montoTotal = 0;
    enviandoJugada = false;
    elementos.grilla.querySelectorAll('.animalito-btn').forEach(b => b.classList.remove('seleccionado'));
    actualizarCarton();
    actualizarContadorJugadas();
    validarFormulario();
    elementos.nombreInput.disabled = false;
    elementos.telefonoInput.disabled = false;
    elementos.montoInput.disabled = false;
    elementos.referenciaInput.disabled = false;
    elementos.formularioContainer.style.display = 'block';
    elementos.paginaResumen.style.display = 'none';
  }

  function bloquearCampos() {
    elementos.nombreInput.disabled = true;
    elementos.telefonoInput.disabled = true;
    elementos.montoInput.disabled = true;
    elementos.referenciaInput.disabled = true;
  }

  // ========== EVENT LISTENERS ==========
  elementos.btnContinuar.addEventListener('click', resetearFormulario);
  elementos.btnDescargarPDFResumen.addEventListener('click', generarYDescargarPDF);

  // ========== INICIALIZACIÓN ==========
  for (let i = 1; i <= 25; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'animalito-btn';
    btn.dataset.numero = i;
    const imgContainer = document.createElement('div');
    imgContainer.style.width = '100%';
    imgContainer.style.height = '100%';
    imgContainer.style.position = 'relative';
    imgContainer.style.display = 'flex';
    imgContainer.style.flexDirection = 'column';
    imgContainer.style.alignItems = 'center';
    imgContainer.style.justifyContent = 'center';

    const img = document.createElement('img');
    img.src = `images/${i}.png`;
    img.alt = nombres[i - 1];
    img.className = 'imagen-animalito';
    const imgContainerRef = imgContainer;
    img.onerror = function() {
      this.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.className = 'emoji-fallback';
      fallback.textContent = emojis[i - 1];
      const nombreElement = document.createElement('div');
      nombreElement.className = 'texto-animalito nombre-animalito';
      nombreElement.textContent = nombres[i - 1];
      const numeroElement = document.createElement('div');
      numeroElement.className = 'texto-animalito numero-animalito';
      numeroElement.textContent = i;
      imgContainerRef.innerHTML = '';
      imgContainerRef.appendChild(fallback);
      imgContainerRef.appendChild(nombreElement);
      imgContainerRef.appendChild(numeroElement);
    };
    img.onload = function() {
      imgContainerRef.appendChild(img);
    };
    btn.appendChild(imgContainer);
    btn.addEventListener('click', () => toggleSeleccion(i));
    elementos.grilla.appendChild(btn);
  }

  elementos.nombreInput.addEventListener('input', validarFormulario);
  elementos.telefonoInput.addEventListener('input', validarFormulario);
  elementos.referenciaInput.addEventListener('input', function() {
    if (this.value.length > 4) this.value = this.value.slice(0, 4);
    validarFormulario();
  });
  elementos.montoInput.addEventListener('input', () => {
    calcularJugadasPermitidas();
    validarFormulario();
  });

  elementos.formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensajeHorario = obtenerMensajeHorario();
    if (mensajeHorario) {
      alert(`❌ No se puede enviar la jugada:\n${mensajeHorario}`);
      return;
    }
    if (enviandoJugada) {
      console.log('⏳ Ya se está enviando una jugada, espera...');
      return;
    }
    const nombre = elementos.nombreInput.value.trim();
    const telefono = elementos.telefonoInput.value;
    let referencia = elementos.referenciaInput.value;
    if (seleccionados.length !== 15) {
      alert('Debes seleccionar exactamente 15 números.');
      return;
    }
    prepararEnvio();
    referencia = formatearReferencia(referencia);
    const jugada = {
      nombre: nombre,
      telefono: telefono,
      referencia: referencia,
      animalitos: [...seleccionados],
      fecha: new Date().toISOString()
    };
    try {
      await guardarJugada(jugada);
      jugadasEnviadas++;
      if (jugadasEnviadas === 1) bloquearCampos();
      if (jugadasEnviadas >= maxJugadasPermitidas) {
        mostrarResumen();
        // ✅ DESCARGA AUTOMÁTICA DEL COMPROBANTE
        setTimeout(() => {
          generarYDescargarPDF();
        }, 800);
        finalizarEnvio();
      } else {
        alert(`✅ Jugada ${jugadasEnviadas} enviada con éxito! Preparando siguiente jugada...`);
        seleccionados = [];
        elementos.grilla.querySelectorAll('.animalito-btn').forEach(b => b.classList.remove('seleccionado'));
        actualizarCarton();
        actualizarContadorJugadas();
        validarFormulario();
        finalizarEnvio();
      }
    } catch (error) {
      console.error('Error al enviar jugada:', error);
      alert('❌ La jugada NO fue registrada. Por favor, inténtalo de nuevo.');
      finalizarEnvio();
    }
  });

  calcularJugadasPermitidas();
  validarFormulario();
  setInterval(mostrarHoraVenezuela, 60000);
  mostrarHoraVenezuela();
  console.log('🚀 Aplicación iniciada correctamente');
  console.log('✅ Sistema de confirmación de jugadas: ACTIVADO');
});