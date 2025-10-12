document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 Iniciando aplicación...');
  
  // === CONFIGURACIÓN ===
  const COSTO_POR_JUGADA = 20;
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-Zh5K0OBodzlm3XjBjmaBez2otuDetKyMMgJa7Mp5jOHEMomcIONHFVObq4UZV5R0_A/exec';

  // HORARIOS PERMITIDOS (Formato 24 horas) - HORA DE VENEZUELA (UTC-4)
  const HORA_INICIO = '00:00:01';
  const HORA_FIN = '21:30:01';
  // =====================

  // Elementos del DOM
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

  // LISTA DE ANIMALES
  const emojis = ['🐶', '🐱', '🐹', '🐰', '🐭', '🦊', '🐬', '🐼', '🐘', '🐯', '🦁', '🐮', '🐷', '🦓', '🐵', '🐔', '🐢', '🐓', '🦆', '🦅', '🦉', '🐊', '🐺', '🦀', '🐴'];
  const nombres = ["Perro", "Gato", "Hamster", "Conejo", "Capibara", "Zorro", "Delfín", "Panda", "Elefante", "Tigre", "León", "Vaca", "Cerdo", "Cebra", "Mono", "Gallina", "Tortuga", "Gallo", "Pato", "Águila", "Búho", "Caimán", "Lobo", "Cangrejo", "Caballo"];

  // ========== FUNCIÓN DE CONTROL DE HORARIOS (VENEZUELA UTC-4) ==========

  function obtenerHoraVenezuela() {
    const ahora = new Date();
    
    // Venezuela es UTC-4 todo el año
    const offsetVenezuela = -4 * 60;
    const offsetLocal = ahora.getTimezoneOffset();
    
    // Calcular la diferencia entre la zona horaria local y Venezuela
    const diffMinutos = offsetLocal - offsetVenezuela;
    
    // Ajustar la hora a la zona horaria de Venezuela
    const horaVenezuela = new Date(ahora.getTime() + diffMinutos * 60000);
    
    return horaVenezuela;
  }

  function estaEnHorarioPermitido() {
    const horaVenezuela = obtenerHoraVenezuela();
    const horaActual = horaVenezuela.toTimeString().split(' ')[0];
    
    console.log(`🕐 Hora local: ${new Date().toTimeString().split(' ')[0]}`);
    console.log(`🇻🇪 Hora Venezuela (UTC-4): ${horaActual}`);
    console.log(`📅 Horario permitido: ${HORA_INICIO} - ${HORA_FIN}`);
    
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
    const opciones = { 
      timeZone: 'America/Caracas',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
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
    
    elementos.textoContador.style.color = '';
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

  // 🚨 **FUNCIÓN CLAVE CORREGIDA** - Compatible con tu Google Apps Script actual
  async function guardarJugada(jugada) {
    const referenciaFormateada = formatearReferencia(jugada.referencia);
    
    // **FORMATO EXACTO que espera tu Google Apps Script**
    const jugadaParaGoogleSheets = {
      nombre: jugada.nombre || '',
      telefono: jugada.telefono.toString(),
      monto: COSTO_POR_JUGADA,
      referencia: referenciaFormateada,
      animalitos: [...jugada.animalitos] // Array como lo espera tu script
    };

    console.log('📤 Enviando a Google Sheets:', jugadaParaGoogleSheets);

    // Guardar localmente
    const jugadaLocal = {
      nombre: jugada.nombre,
      telefono: jugada.telefono,
      referencia: referenciaFormateada,
      animalitos: [...jugada.animalitos],
      fecha: new Date().toISOString(),
      numeroJugada: jugadasActuales.length + 1,
      monto: COSTO_POR_JUGADA
    };
    
    jugadasActuales.push(jugadaLocal);
    
    // **ENVÍO A GOOGLE SHEETS - Formato compatible**
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jugadaParaGoogleSheets)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Jugada guardada EXITOSAMENTE en Google Sheets');
        console.log('📊 Datos guardados:', jugadaParaGoogleSheets);
      } else {
        console.log('⚠️ Error en Google Sheets:', result.error);
        console.log('📦 Datos guardados localmente:', jugadaLocal);
      }
    } catch (error) {
      console.log('⚠️ Error de conexión, pero guardado localmente');
      console.error('Error:', error);
    }
    
    return jugadaLocal;
  }

  function mostrarResumen() {
    elementos.resumenJugadas.innerHTML = '';
    
    if (jugadasActuales.length === 0) {
      elementos.resumenJugadas.innerHTML = '<p class="sin-jugadas">No hay jugadas para mostrar</p>';
      return;
    }

    const primeraJugada = jugadasActuales[0];
    
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
          <span>${primeraJugada.telefono}</span>
        </div>
        <div class="dato-item">
          <strong>Monto Total Transferido:</strong>
          <span>$${montoTotal}</span>
        </div>
        <div class="dato-item">
          <strong>Referencia:</strong>
          <span>${primeraJugada.referencia}</span>
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

  elementos.btnDescargarPDFResumen.addEventListener('click', function() {
    if (jugadasActuales.length === 0) {
      alert('No hay jugadas para generar comprobante.');
      return;
    }

    let jsPDF = window.jspdf.jsPDF;
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.setTextColor(25, 118, 210);
      doc.text('COMPROBANTE DE JUGADAS - ANIMALITOS', 105, 20, { align: 'center' });
      
      const primeraJugada = jugadasActuales[0];
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      doc.text(`Nombre y Apellido: ${primeraJugada.nombre}`, 20, 40);
      doc.text(`Teléfono: ${primeraJugada.telefono}`, 20, 50);
      doc.text(`Monto Total Transferido: $${montoTotal}`, 20, 60);
      doc.text(`Referencia: ${primeraJugada.referencia}`, 20, 70);
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
        
        doc.text(jugada.numeroJugada.toString(), 25, yPosition);
        
        const animalitosTexto = jugada.animalitos.join(', ');
        const animalitosLines = doc.splitTextToSize(animalitosTexto, 120);
        
        let lineHeight = yPosition;
        animalitosLines.forEach(line => {
          doc.text(line, 60, lineHeight);
          lineHeight += 5;
        });
        
        yPosition = lineHeight + 8;
      });
      
      doc.save(`comprobante_${primeraJugada.referencia}.pdf`);
      
    } catch (error) {
      console.error('Error al generar comprobante:', error);
      alert('Error al generar comprobante: ' + error.message);
    }
  });

  // ========== INICIALIZACIÓN ==========

  // Crear botones de animalitos
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

  // Event listeners del formulario
  elementos.nombreInput.addEventListener('input', validarFormulario);
  elementos.telefonoInput.addEventListener('input', validarFormulario);
  elementos.referenciaInput.addEventListener('input', function() {
    if (this.value.length > 4) {
      this.value = this.value.slice(0, 4);
    }
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
      
      if (jugadasEnviadas === 1) {
        bloquearCampos();
      }
      
      if (jugadasEnviadas >= maxJugadasPermitidas) {
        mostrarResumen();
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
      alert('Error al enviar jugada. Por favor, intenta de nuevo.');
      finalizarEnvio();
    }
  });

  // Inicialización
  calcularJugadasPermitidas();
  validarFormulario();
  
  setInterval(mostrarHoraVenezuela, 60000);
  mostrarHoraVenezuela();
  
  console.log('🚀 Aplicación iniciada correctamente');
  console.log('📊 Integración con Google Sheets: ACTIVADA');
  console.log('🔄 Formato de datos COMPATIBLE con Google Apps Script existente');
});

