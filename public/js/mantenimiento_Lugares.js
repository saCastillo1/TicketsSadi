
// Tickets Sadi - Mantenimiento de Lugares 


var db = firebase.apps[0].firestore();

const lista_Provincias = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

const form_Lugar = document.querySelector('#form_Lugar');
const titulo_Formulario = document.querySelector('#titulo_Formulario');
const txt_Id = document.querySelector('#txt_Id');
const txt_Nombre = document.querySelector('#txt_Nombre');
const cbo_Provincia = document.querySelector('#cbo_Provincia');
const txt_Direccion = document.querySelector('#txt_Direccion');
const txt_Capacidad = document.querySelector('#txt_Capacidad');
const btn_Guardar = document.querySelector('#btn_Guardar');
const btn_Cancelar = document.querySelector('#btn_Cancelar');
const cbo_Filtro_Provincia = document.querySelector('#cbo_Filtro_Provincia');
const txt_Filtro_Capacidad = document.querySelector('#txt_Filtro_Capacidad');
const tabla_Lugares = document.querySelector('#tabla_Lugares');

var lista_Lugares = [];   // todos los lugares (se actualiza en tiempo real)

// llenar las listas de provincias
cbo_Provincia.innerHTML = '<option value="">-- Seleccione --</option>' +
	lista_Provincias.map(p => '<option>' + p + '</option>').join('');
cbo_Filtro_Provincia.innerHTML = '<option value="">Todas</option>' +
	lista_Provincias.map(p => '<option>' + p + '</option>').join('');

// LEER: escucha la colección en tiempo real
db.collection('lugares').orderBy('nombre').onSnapshot(function (consulta) {
	lista_Lugares = consulta.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
	mostrar_Lugares();
}, function (error) {
	tabla_Lugares.innerHTML = '<tr><td colspan="5" class="text-danger">Error al cargar: ' + escapar_Texto(error.message) + '</td></tr>';
});

// CONSULTAS: se vuelve a dibujar la tabla al cambiar un filtro
cbo_Filtro_Provincia.addEventListener('change', mostrar_Lugares);
txt_Filtro_Capacidad.addEventListener('input', mostrar_Lugares);

function mostrar_Lugares() {
	const provincia = cbo_Filtro_Provincia.value;
	const capacidad_Minima = parseInt(txt_Filtro_Capacidad.value) || 0;

	const filtrados = lista_Lugares.filter(l =>
		(!provincia || l.provincia === provincia) && l.capacidad >= capacidad_Minima);

	if (filtrados.length === 0) {
		tabla_Lugares.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay lugares para mostrar.</td></tr>';
		return;
	}

	tabla_Lugares.innerHTML = filtrados.map(l =>
		'<tr>' +
			'<td>' + escapar_Texto(l.nombre) + '</td>' +
			'<td>' + escapar_Texto(l.provincia) + '</td>' +
			'<td class="small">' + escapar_Texto(l.direccion) + '</td>' +
			'<td>' + l.capacidad.toLocaleString('es-CR') + '</td>' +
			'<td class="text-end text-nowrap">' +
				'<button class="btn btn-sm btn-outline-primary me-1" onclick="editar_Lugar(\'' + l.id + '\')">Editar</button>' +
				'<button class="btn btn-sm btn-outline-danger" onclick="eliminar_Lugar(\'' + l.id + '\')">Eliminar</button>' +
			'</td>' +
		'</tr>').join('');
}

// CREAR y MODIFICAR
form_Lugar.addEventListener('submit', function (e) {
	e.preventDefault();
	const capacidad = Number(txt_Capacidad.value);
	if (!Number.isInteger(capacidad) || capacidad <= 0) {
		alert('La capacidad debe ser un número entero mayor que cero.');
		return;
	}

	const datos = {
		nombre: txt_Nombre.value.trim(),
		provincia: cbo_Provincia.value,
		direccion: txt_Direccion.value.trim(),
		capacidad: capacidad
	};

	// se guarda antes de la operación: si el usuario toca Cancelar o Editar mientras
	// se guarda, txt_Id cambia y el mensaje saldría equivocado
	const id_Editando = txt_Id.value;
	const es_Modificacion = id_Editando !== '';

	btn_Guardar.disabled = true;
	let operacion;
	if (es_Modificacion) {
		operacion = db.collection('lugares').doc(id_Editando).update(datos);
	} else {
		datos.fecha_Creacion = firebase.firestore.FieldValue.serverTimestamp();
		operacion = db.collection('lugares').add(datos);
	}

	operacion
		.then(function () {
			alert(es_Modificacion ? 'Lugar modificado' : 'Lugar registrado');
			limpiar_Formulario();
		})
		.catch(function (error) {
			alert('No se pudo guardar el lugar: ' + error.message);
		})
		.finally(function () {
			btn_Guardar.disabled = false;
		});
});

// carga los datos del lugar en el formulario para modificarlo
function editar_Lugar(id) {
	const lugar = lista_Lugares.find(l => l.id === id);
	if (!lugar) return;
	txt_Id.value = lugar.id;
	txt_Nombre.value = lugar.nombre;
	cbo_Provincia.value = lugar.provincia;
	txt_Direccion.value = lugar.direccion;
	txt_Capacidad.value = lugar.capacidad;
	titulo_Formulario.textContent = 'Modificar lugar';
	txt_Nombre.focus();
}

// ELIMINAR: no se permite si el lugar tiene eventos registrados
function eliminar_Lugar(id) {
	const lugar = lista_Lugares.find(l => l.id === id);
	if (!lugar) return;

	db.collection('eventos').where('lugar_Id', '==', id).limit(1).get()
		.then(function (consulta) {
			if (!consulta.empty) {
				alert('No se puede eliminar "' + lugar.nombre + '" porque tiene eventos registrados.');
				return;
			}
			if (!confirm('¿Eliminar el lugar "' + lugar.nombre + '"?')) return;
			return db.collection('lugares').doc(id).delete()
				.then(function () {
					if (txt_Id.value === id) limpiar_Formulario();
				});
		})
		.catch(function (error) {
			alert('No se pudo eliminar el lugar: ' + error.message);
		});
}

btn_Cancelar.addEventListener('click', limpiar_Formulario);

function limpiar_Formulario() {
	form_Lugar.reset();
	txt_Id.value = '';
	titulo_Formulario.textContent = 'Nuevo lugar';
}
