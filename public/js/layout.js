

const opciones_Menu = [
	{ texto: 'Inicio', url: 'index.html' },
	{ texto: 'Usuarios', url: 'modulo_Usuarios.html' },
	{ texto: 'Mantenimientos', url: 'modulo_Mantenimientos.html' },
	{ texto: 'Proceso principal', url: 'modulo_Proceso_Principal.html' },
	{ texto: 'Acerca de', url: 'modulo_Acerca_De.html' }
];

function dibujar_Menu() {
	const pagina_Actual = location.pathname.split('/').pop() || 'index.html';

	let enlaces = '';
	opciones_Menu.forEach(function (opcion) {
		const activo = opcion.url === pagina_Actual ? ' active' : '';
		enlaces += '<li class="nav-item"><a class="nav-link' + activo + '" href="' + opcion.url + '">' + opcion.texto + '</a></li>';
	});

	document.querySelector('#menu_Principal').innerHTML =
		'<nav class="navbar navbar-expand-lg navbar-dark barra_Menu">' +
		'<div class="container">' +
		'<a class="navbar-brand fw-bold" href="index.html">Tickets Sadi</a>' +
		'<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#lista_Menu" ' +
		'aria-controls="lista_Menu" aria-expanded="false" aria-label="Abrir menú">' +
		'<span class="navbar-toggler-icon"></span></button>' +
		'<div class="collapse navbar-collapse" id="lista_Menu"><ul class="navbar-nav ms-auto">' + enlaces + '</ul></div>' +
		'</div></nav>';

	document.querySelector('#pie_Pagina').innerHTML =
		'<footer><div class="container">Tickets Sadi · ITI-621 Tecnologías y Sistemas Web III · UTN Sede del Pacífico</div></footer>';
}

dibujar_Menu();
