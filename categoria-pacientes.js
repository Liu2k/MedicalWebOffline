// categoria-pacientes.js
// Lógica para la gestión de pacientes

document.addEventListener('DOMContentLoaded', () => {
  // Obtener información del usuario
  const params = new URLSearchParams(window.location.search);
  const usuario = params.has('practicante') ? 'practicante' : 'admin';
  const nombre = params.get('nombre') || (usuario === 'admin' ? 'Administrador' : 'Practicante');

  // Mostrar nombre del usuario
  let usuarioActualNombre = '';
  try {
    const usuarioActualLS = JSON.parse(localStorage.getItem('usuarioActual'));
    if (usuarioActualLS && usuarioActualLS.nombre) {
      usuarioActualNombre = usuarioActualLS.nombre;
    }
  } catch (e) {}
  
  const userNameSpan = document.getElementById('userName');
  if (userNameSpan) {
    userNameSpan.textContent = usuarioActualNombre || nombre;
  }

  // Actualizar título para practicantes
  const headerTitle = document.getElementById('headerTitle');
  if (headerTitle && usuario === 'practicante') {
    headerTitle.textContent = 'Medical Developer';
  }

  // Lógica del menú de usuario
  const userIcon = document.getElementById('userIcon');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (userIcon && userDropdown) {
    userIcon.onclick = function(e) {
      userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
      e.stopPropagation();
    };
    document.body.addEventListener('click', function() {
      userDropdown.style.display = 'none';
    });
  }
  
  if (logoutBtn) {
    logoutBtn.onclick = function() {
      window.location.href = 'index.html';
    };
  }

  // Configurar botón de volver
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    if (usuario === 'practicante') {
      // Ocultar el botón para practicantes
      backBtn.style.display = 'none';
    } else {
      // Los admins van al menú principal
      backBtn.onclick = function() {
        window.history.back();
      };
    }
  }

  // Manejo de navegación lateral
  const sidebarButtons = document.querySelectorAll('.sidebar-menu button');
  const sections = document.querySelectorAll('.form-section');
  const defaultSection = document.getElementById('default-section');

  sidebarButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-section');
      
      // Remover clase active de todos los botones
      sidebarButtons.forEach(btn => btn.classList.remove('active'));
      // Agregar clase active al botón clickeado
      this.classList.add('active');
      
      // Ocultar sección por defecto
      if (defaultSection) {
        defaultSection.style.display = 'none';
      }
      
      // Ocultar todas las secciones
      sections.forEach(section => {
        section.classList.remove('active');
      });
      
      // Mostrar sección seleccionada
      const activeSection = document.getElementById(`${targetSection}-section`);
      if (activeSection) {
        activeSection.classList.add('active');
      }
    });
  });

  // Mostrar por defecto la sección de historial al cargar la página
  const historialBtn = document.querySelector('button[data-section="historial"]');
  if(historialBtn) {
    historialBtn.click();
  }


  // --- INICIO DEL CÓDIGO PARA FORMULARIO Y REGISTRO DE PACIENTES ---

  // Selección de elementos del DOM para el formulario
  const pesoInput = document.getElementById('peso');
  const alturaInput = document.getElementById('altura');
  const imcResultado = document.getElementById('imc-resultado');
  const form = document.getElementById('patient-form');
  const errorMessage = document.getElementById('error-message');
  const historyBody = document.getElementById('history-body');

  // Cargar historial desde localStorage al iniciar la página
  cargarHistorial();

  // Criterio de Aceptación: El cálculo del IMC debe realizarse automáticamente
  // Se añade un listener a los campos de peso y altura para calcular en tiempo real.
  if(pesoInput) pesoInput.addEventListener('input', calcularYMostrarIMC);
  if(alturaInput) alturaInput.addEventListener('input', calcularYMostrarIMC);

  // Manejo del envío del formulario
  if(form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que la página se recargue
        validarYGuardarDatos();
    });
  }

  /**
   * Calcula el IMC basado en los valores de los inputs y lo muestra en la interfaz.
   * Requerimiento: El sistema calculará automáticamente el IMC.
   */
  function calcularYMostrarIMC() {
      const peso = parseFloat(pesoInput.value);
      const alturaCm = parseFloat(alturaInput.value);

      if (peso > 0 && alturaCm > 0) {
          const alturaM = alturaCm / 100;
          const imc = peso / (alturaM * alturaM);
          imcResultado.textContent = imc.toFixed(2); // Muestra con 2 decimales
      } else {
          imcResultado.textContent = '---';
      }
  }

  /**
   * Valida todos los campos y, si son correctos, guarda el registro.
   */
  function validarYGuardarDatos() {
      const datos = {
          peso: pesoInput.value.trim(),
          altura: alturaInput.value.trim(),
          presion: document.getElementById('presion').value.trim(),
          glucosa: document.getElementById('glucosa').value.trim(),
          temperatura: document.getElementById('temperatura').value.trim()
      };

      let errores = [];

      // Criterio de Aceptación: Validaciones para asegurar que los datos sean coherentes.
      if (!datos.peso || isNaN(datos.peso) || parseFloat(datos.peso) <= 0) {
          errores.push('El peso debe ser un número positivo.');
      }
      if (!datos.altura || isNaN(datos.altura) || parseFloat(datos.altura) <= 0) {
          errores.push('La altura debe ser un número positivo.');
      }
      if (!datos.glucosa || isNaN(datos.glucosa) || parseFloat(datos.glucosa) < 0) {
          errores.push('La glucosa debe ser un número válido.');
      }
      if (!datos.temperatura || isNaN(datos.temperatura)) {
          errores.push('La temperatura debe ser un valor numérico.');
      }
      if (datos.presion === '') {
          errores.push('La presión arterial es requerida.');
      }

      if (errores.length > 0) {
          // Requerimiento: Si se ingresan valores inválidos, el sistema debe mostrar un mensaje de error.
          errorMessage.innerHTML = errores.join('<br>');
          errorMessage.style.display = 'block';
      } else {
          // Si no hay errores, se oculta el mensaje y se procede a guardar.
          errorMessage.style.display = 'none';
          
          const registro = {
              ...datos,
              imc: imcResultado.textContent,
              fecha: new Date().toLocaleString('es-MX')
          };
          
          guardarRegistro(registro);
          actualizarTablaHistorial(registro);
          form.reset(); // Limpia el formulario
          imcResultado.textContent = '---';
          
          // Usamos tu función de confirmación para una mejor UX
          mostrarConfirmacion('Registro Exitoso', 'Los datos médicos se han guardado correctamente.');
      }
  }
  
  /**
   * Guarda un nuevo registro en el localStorage del navegador.
   */
  function guardarRegistro(registro) {
      const historial = JSON.parse(localStorage.getItem('historialPacientes')) || [];
      historial.unshift(registro); // Añade el nuevo registro al inicio
      localStorage.setItem('historialPacientes', JSON.stringify(historial));
  }

  /**
   * Carga el historial desde localStorage y lo muestra en la tabla.
   */
  function cargarHistorial() {
      if(!historyBody) return;
      const historial = JSON.parse(localStorage.getItem('historialPacientes')) || [];
      historyBody.innerHTML = ''; // Limpia la tabla antes de cargar
      historial.forEach(registro => actualizarTablaHistorial(registro, false));
  }

  /**
   * Añade una nueva fila a la tabla de historial.
   */
  function actualizarTablaHistorial(registro, esNuevo = true) {
      if(!historyBody) return;
      const fila = document.createElement('tr');
      fila.innerHTML = `
          <td>${registro.fecha}</td>
          <td>${registro.peso}</td>
          <td>${registro.altura}</td>
          <td>${registro.imc}</td>
          <td>${registro.presion}</td>
          <td>${registro.glucosa}</td>
          <td>${registro.temperatura}</td>
      `;
      
      if (esNuevo) {
          historyBody.prepend(fila); // Añade la nueva fila al principio
      } else {
          historyBody.appendChild(fila); // Añade al final durante la carga inicial
      }
  }

  // --- FIN DEL CÓDIGO PARA FORMULARIO Y REGISTRO DE PACIENTES ---


  // Función para mostrar confirmaciones
  function mostrarConfirmacion(titulo, mensaje) {
    // Crear modal dinámicamente
    const modal = document.createElement('div');
    modal.style.cssText = `
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, rgba(125, 211, 252, 0.9), rgba(254, 243, 199, 0.9));
      z-index: 9999;
      justify-content: center;
      align-items: center;
    `;
    
    modal.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.98);
        padding: 30px;
        border-radius: 20px;
        min-width: 350px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(125, 211, 252, 0.4);
        position: relative;
        margin: 20px;
      ">
        <div style="margin-bottom: 20px; font-size: 3rem;">✅</div>
        <h3 style="
          margin: 0 0 15px 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: transparent;
          background: linear-gradient(135deg, #06b6d4, #10b981);
          -webkit-background-clip: text;
          background-clip: text;
        ">${titulo}</h3>
        <p style="
          margin: 0 0 25px 0;
          font-size: 1.1rem;
          color: #374151;
          line-height: 1.5;
        ">${mensaje}</p>
        <button onclick="this.closest('div[style*=\'position: fixed\']').remove()" style="
          background: linear-gradient(135deg, #7dd3fc, #fef3c7);
          color: #1f2937;
          border: none;
          border-radius: 25px;
          padding: 12px 30px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(125, 211, 252, 0.3);
        ">Aceptar</button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
});