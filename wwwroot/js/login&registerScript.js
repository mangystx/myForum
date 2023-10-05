const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnLogin = document.querySelector('.btn-login');
const iconClose = document.querySelector('.icon-close');
const form = document.querySelector('form');
const articlesLink = document.querySelector('.articles-link');
const contactLink = document.querySelector('.contact-link');
const scrollHeaders = document.querySelectorAll('.scroll-header');

scrollHeaders.forEach(header => {
	header.addEventListener('click', event => {
		event.preventDefault();
		document.querySelector('header').scrollIntoView({ behavior: 'smooth' });
	});
});

articlesLink.addEventListener('click', event => {
	event.preventDefault();
	document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
});

contactLink.addEventListener('click', event => {
	event.preventDefault();
	document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
});

registerLink.addEventListener('click', () => {
	wrapper.classList.add('active');
});

loginLink.addEventListener('click', () => {
	wrapper.classList.remove('active');
});

btnLogin.addEventListener('click', () => {
	wrapper.classList.add('active-login-menu');
});

iconClose.addEventListener('click', () => {
	wrapper.classList.remove('active-login-menu');
});

form.addEventListener('submit', async event => {
	event.preventDefault();
	const formData = new FormData(form);
	const response = await fetch(form.action, {
		method: 'POST',
		body: formData
	});
	
	if (response.ok || response.redirected) {
		btnLogin.classList.remove('btn-login');
		btnLogin.classList.add('btn-logout');
		wrapper.classList.remove('active-login-menu');
	} else if (response.status === 401) {
		const errorMessage = document.querySelector('.register-error-message');
		errorMessage.textContent = "This user does not exist";
		wrapper.classList.add('active');
	} else {
		const error = await response.text();
		console.error(`HTTP Error: ${response.status} - ${error}`);
	}
});

document.addEventListener('click', async event => {
	const btnLogout = event.target.closest('.btn-logout');
	if (btnLogout) {
		const response = await fetch('/logout', {
			method: 'GET'
		});
		if (response.ok) {
			const button = document.querySelector('.btn-logout');
			button.classList.remove('btn-logout');
			button.classList.add('btn-login');
		} else {
			console.error('Failed to logout');
		}
	}
});
