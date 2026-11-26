// Tickets Sadi - Mantenimiento de Eventos 


var db = firebase.apps[0].firestore();

const lista_Categorias = ['Concierto', 'Festival', 'Deporte', 'Otro'];
const lista_Estados = ['Próximo', 'Agotado', 'Finalizado', 'Cancelado'];

const form_Evento = document.querySelector('#form_Evento');
const titulo_Formulario = document.querySelector('#titulo_Formulario');
const txt_Id = document.querySelector('#txt_Id');
const txt_Nombre = document.querySelector('#txt_Nombre');
const cbo_Categoria = document.querySelector('#cbo_Categoria');
const cbo_Lugar = document.querySelector('#cbo_Lugar');
const lbl_Sin_Lugares = document.querySelector('#lbl_Sin_Lugares');
const txt_Fecha = document.querySelector('#txt_Fecha');
const txt_Descripcion = document.querySelector('#txt_Descripcion');
const cbo_Estado = document.querySelector('#cbo_Estado');
const btn_Guardar = document.querySelector('#btn_Guardar');
const btn_Cancelar = document.querySelector('#btn_Cancelar');
const cbo_Filtro_Categoria = document.querySelector('#cbo_Filtro_Categoria');
const txt_Filtro_Desde = document.querySelector('#txt_Filtro_Desde');
const txt_Filtro_Hasta = document.querySelector('#txt_Filtro_Hasta');
const tabla_Eventos = document.querySelector('#tabla_Eventos');

var lista_Eventos = [];   // todos los eventos (tiempo real)
var lista_Lugares = [];   // lugares para el combo

// llenar listas fijas
cbo_Categoria.innerHTML = '<option value="">-- Seleccione --</option>' +
	lista_Categorias.map(c => '<option>' + c + '</option>').join('');
cbo_Filtro_Categoria.innerHTML = '<option value="">Todas</option>' +
	lista_Categorias.map(c => '<option>' + c + '</option>').join('');
cbo_Estado.innerHTML = lista_Estados.map(e => '<option>' + e + '</option>').join('');

// lugares disponibles (vienen del mantenimiento de Lugares)
db.collection('lugares').orderBy('nombre').onSnapshot(function (consulta) {
	lista_Lugares = consulta.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
	const seleccionado = cbo_Lugar.value;
	cbo_Lugar.innerHTML = '<option value="">-- Seleccione --</option>' +
		lista_Lugares.map(l => '<option value="' + l.id + '">' + escapar_Texto(l.nombre) + ' (' + escapar_Texto(l.provincia) + ')</option>').join('');
	cbo_Lugar.value = seleccionado;
	lbl_Sin_Lugares.textContent = lista_Lugares.length ? '' : 'Primero registre un lugar en el mantenimiento de Lugares.';
});

// LEER: eventos en tiempo real, ordenados por fecha
db.collection('eventos').orderBy('fecha_Evento').onSnapshot(function (consulta) {
	lista_Eventos = consulta.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
	mostrar_Eventos();
}, function (error) {
	tabla_Eventos.innerHTML = '<tr><td colspan="6" class="text-danger">Error al cargar: ' + escapar_Texto(error.message) + '</td></tr>';
});

// CONSULTAS
cbo_Filtro_Categoria.addEventListener('change', mostrar_Eventos);
txt_Filtro_Desde.addEventListener('change', mostrar_Eventos);
txt_Filtro_Hasta.addEventListener('change', mostrar_Eventos);

function mostrar_Eventos() {
	const categoria = cbo_Filtro_Categoria.value;
	const desde = txt_Filtro_Desde.value ? new Date(txt_Filtro_Desde.value + 'T00:00:00') : null;
	// "hasta" incluye todo ese día: se compara contra las 00:00 del día siguiente
	let hasta = null;
	if (txt_Filtro_Hasta.value) {
		hasta = new Date(txt_Filtro_Hasta.value + 'T00:00:00');
		hasta.setDate(hasta.getDate() + 1);
	}

	const filtrados = lista_Eventos.filter(function (ev) {
		if (!ev.fecha_Evento) return false;
		const fecha = ev.fecha_Evento.toDate();
		return (!categoria || ev.categoria === categoria) &&
			   (!desde || fecha >= desde) &&
			   (!hasta || fecha < hasta);
	});

	if (filtrados.length === 0) {
		tabla_Eventos.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay eventos para mostrar.</td></tr>';
		return;
	}

	tabla_Eventos.innerHTML = filtrados.map(ev =>
		'<tr>' +
			'<td>' + escapar_Texto(ev.nombre) + '</td>' +
			'<td>' + escapar_Texto(ev.categoria) + '</td>' +
			'<td class="small">' + escapar_Texto(ev.lugar_Nombre) + '</td>' +
			'<td class="small">' + formato_Fecha(ev.fecha_Evento) + '</td>' +
			'<td><span class="badge bg-secondary">' + escapar_Texto(ev.estado) + '</span></td>' +
			'<td class="text-end text-nowrap">' +
				'<button class="btn btn-sm btn-outline-primary me-1" onclick="editar_Evento(\'' + ev.id + '\')">Editar</button>' +
				'<button class="btn btn-sm btn-outline-danger" onclick="eliminar_Evento(\'' + ev.id + '\')">Eliminar</button>' +
			'</td>' +
		'</tr>').join('');
}

// CREAR y MODIFICAR
form_Evento.addEventListener('submit', function (e) {
	e.preventDefault();
	const lugar = lista_Lugares.find(l => l.id === cbo_Lugar.value);
	if (!lugar) {
		alert('Seleccione un lugar.');
		return;
	}

	const fecha = new Date(txt_Fecha.value);   // "AAAA-MM-DDTHH:MM" se interpreta en hora local
	if (isNaN(fecha.getTime())) {
		alert('Indique una fecha y hora válidas.');
		return;
	}

	const datos = {
		nombre: txt_Nombre.value.trim(),
		categoria: cbo_Categoria.value,
		lugar_Id: lugar.id,
		lugar_Nombre: lugar.nombre,
		fecha_Evento: firebase.firestore.Timestamp.fromDate(fecha),
		descripcion: txt_Descripcion.value.trim(),
		estado: cbo_Estado.value
	};

	// se guarda antes de la operación: si el usuario toca Cancelar o Editar mientras
	// se guarda, txt_Id cambia y el mensaje saldría equivocado
	const id_Editando = txt_Id.value;
	const es_Modificacion = id_Editando !== '';

	btn_Guardar.disabled = true;
	let operacion;
	if (es_Modificacion) {
		operacion = db.collection('eventos').doc(id_Editando).update(datos);
	} else {
		datos.fecha_Creacion = firebase.firestore.FieldValue.serverTimestamp();
		operacion = db.collection('eventos').add(datos);
	}

	operacion
		.then(function () {
			alert(es_Modificacion ? 'Evento modificado' : 'Evento registrado');
			limpiar_Formulario();
		})
		.catch(function (error) {
			alert('No se pudo guardar el evento: ' + error.message);
		})
		.finally(function () {
			btn_Guardar.disabled = false;
		});
});

function editar_Evento(id) {
	const ev = lista_Eventos.find(x => x.id === id);
	if (!ev) return;
	txt_Id.value = ev.id;
	txt_Nombre.value = ev.nombre;
	cbo_Categoria.value = ev.categoria;
	cbo_Lugar.value = ev.lugar_Id;
	txt_Fecha.value = fecha_A_Input(ev.fecha_Evento);
	txt_Descripcion.value = ev.descripcion;
	cbo_Estado.value = ev.estado;
	titulo_Formulario.textContent = 'Modificar evento';
	txt_Nombre.focus();
}

// ELIMINAR
// Pendiente (segundo 50%): impedir eliminar un evento que ya tenga tipos de entrada o entradas vendidas.
function eliminar_Evento(id) {
	const ev = lista_Eventos.find(x => x.id === id);
	if (!ev || !confirm('¿Eliminar el evento "' + ev.nombre + '"?')) return;
	db.collection('eventos').doc(id).delete()
		.then(function () {
			if (txt_Id.value === id) limpiar_Formulario();
		})
		.catch(function (error) {
			alert('No se pudo eliminar el evento: ' + error.message);
		});
}

btn_Cancelar.addEventListener('click', limpiar_Formulario);

function limpiar_Formulario() {
	form_Evento.reset();
	txt_Id.value = '';
	titulo_Formulario.textContent = 'Nuevo evento';
}
