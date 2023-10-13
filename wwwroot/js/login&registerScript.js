const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnLogin = document.querySelector('.btn-login');
const iconClose = document.querySelector('.icon-close');
const form = document.querySelector('form');
const articlesLink = document.querySelector('.articles-link');
const contactLink = document.querySelector('.contact-link');
const scrollHeaders = document.querySelectorAll('.scroll-header');
const addArticle = document.querySelector('.add-article');

async function OnLoad(){
	await loadArticles();
	const response = await fetch("/isAuthorized");
	if (response.ok) {
		btnLogin.classList.remove('btn-login');
		btnLogin.classList.add('btn-logout');
	}
}

document.addEventListener('DOMContentLoaded', OnLoad);

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
	const passwordInput = document.querySelector('input[name="password"]');
	if (passwordInput.value.length < 8) {
		alert('Password at least must be a 8 characters long');
		return;
	} 
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

async function loadArticles() {
	const response = await fetch('/get-articles');
	const articles = await response.json();

	const mainElement = document.querySelector('main');

	articles.forEach(article => {
		const articlePreview = document.createElement('div');
		articlePreview.classList.add('article-preview');
		articlePreview.innerHTML = `
            <h3>${article.title}</h3>
            <p>${article.description.replaceAll("@@@", "<br>")
			.replaceAll("@@", " ")}...</p>
        `;
		mainElement.appendChild(articlePreview);
		articlePreview.addEventListener('click', async () => {
			const articleId = article.id;
			try {
				await fetch(`/articles/${articleId}`).then(response => response.text())
					.then(html => { document.body.innerHTML = html; });
				let  links = document.head.getElementsByTagName('link');
				for (let i = 0; i < links.length; i++) {
					let link = links[i];
					if (link.rel === 'stylesheet') {
						link.href = '../css/articleStyle.css';
					}
				}
				const newScript = document.createElement('script');
				newScript.src = '../js/articleScript.js';
				document.body.appendChild(newScript);
			} catch (error) {
				console.error('Error in receiving the article', error);
			}
		});
	});
}

addArticle.addEventListener('click', async () => {
	const response = await fetch("/new-article");
	const scriptToRemove = document.querySelector('script[src="js/login&registerScript.js"]');
	if (scriptToRemove) {
		scriptToRemove.remove();
	}
	document.body.innerHTML = await response.text();
	
	let  links = document.head.getElementsByTagName('link');
	for (let i = 0; i < links.length; i++) {
		let link = links[i];
		if (link.rel === 'stylesheet') {
			link.href = '../css/createArticleStyle.css';
		}
	}
	const newScript = document.createElement('script');
	newScript.src = '../js/createArticleScript.js';
	document.body.appendChild(newScript);
});
