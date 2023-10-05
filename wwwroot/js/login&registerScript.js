const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnLogin = document.querySelector('.btn-login');
const iconClose = document.querySelector('.icon-close');
const form = document.querySelector('form');
const articlesLink = document.querySelector('.articles-link');
const contactLink = document.querySelector('.contact-link');

articlesLink.addEventListener('click', function(event) {
	event.preventDefault();
	document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
});

contactLink.addEventListener('click', function(event) {
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

form.addEventListener('submit', async (e) => {
	console.log("in submit");
	e.preventDefault();
	console.log("after prevent");
	const formData = new FormData(form);
	const response = await fetch(form.action, {
		method: 'POST',
		body: formData
	});
	
	if (response.ok || response.redirected) {
		console.log("in response ok");
		btnLogin.classList.remove('btn-login');
		btnLogin.classList.add('btn-logout');
		wrapper.classList.remove('active-login-menu');
	} else if (response.status === 401) {
		console.log("in 401");
		const errorMessage = document.querySelector('.register-error-message');
		errorMessage.textContent = "This user does not exist";
		wrapper.classList.add('active');
	} else {
		console.log("in error");
		const error = await response.text();
		console.error(`HTTP Error: ${response.status} - ${error}`);
	}
	console.log("end");
});

document.addEventListener('click', async (event) => {
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
