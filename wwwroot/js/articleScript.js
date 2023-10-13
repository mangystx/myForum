const text = document.getElementById('title');
const treeLeft = document.getElementById('tree-left');
const treeRight = document.getElementById('tree-right');
const gateLeft = document.getElementById('gate-left');
const gateRight = document.getElementById('gate-right');
const articleDataElement = document.getElementById('articleData');
const articleDataScript = articleDataElement.textContent;
let isEditMode = false;
document.querySelector('.parallax').scrollIntoView({ behavior: 'smooth' });

eval(articleDataScript);

const articleId = articleData.ArticleId;
const canEdit = articleData.CanEdit;
console.log(articleId);
console.log(canEdit)
if (canEdit) {
    // Створюємо контейнер для кнопок
    let btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container';
    document.body.appendChild(btnContainer);

    // Створюємо кнопку редагування
    let editButton = document.createElement('button');
    editButton.className = 'btn-edit';
    let editIcon = document.createElement('ion-icon');
    editIcon.setAttribute('name', 'create-outline');
    editButton.appendChild(editIcon);
    btnContainer.appendChild(editButton);

    // Створюємо кнопку видалення
    let deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    let deleteIcon = document.createElement('ion-icon');
    deleteIcon.setAttribute('name', 'trash-outline');
    deleteButton.appendChild(deleteIcon);
    btnContainer.appendChild(deleteButton);

    document.querySelector('.btn-edit').addEventListener('click', () => {
        if (!isEditMode) {
            enterEditMode();
        }
    });

    document.querySelector('.btn-delete').addEventListener('click', async () => {
        if (confirm('Are you sure?')) {
            await fetch(`/article-delete/${articleId}`, {
                method: 'DELETE'
            })
            window.location.href = "/";
        }
    });
}
window.addEventListener('scroll', () => {
    let value = window.scrollY;
    text.style.marginTop = Math.min(Math.max(value * 2.5, 0), 800) + 'px';
    treeLeft.style.left = Math.min(Math.max(value * -1.5, -800), 800) + 'px';
    treeRight.style.left = Math.min(Math.max(value * 1.5, -800), 800) + 'px';
    gateLeft.style.left = Math.min(Math.max(value * 0.5, -800), 800) + 'px';
    gateRight.style.left = Math.min(Math.max(value * -0.5, -800), 800) + 'px';
})

function enterEditMode() {
    isEditMode = true;
    const mainText = document.querySelector('.main-text');
    const title = document.getElementById('title');
    mainText.setAttribute('contenteditable', 'true');
    title.setAttribute('contenteditable', 'true');
    
    const applyChanges = document.querySelector('.apply-changes-container');
    applyChanges.style.display = 'block';
    // Додаємо кнопки "Зберегти" та "Скасувати"
    const saveButton = document.createElement('button');
    saveButton.className = 'btn-save';
    saveButton.innerText = 'Save';
    saveButton.addEventListener('click', async () => {
        const newTitle = title.innerText;
        const newContent = mainText.innerText;
        // Надсилаємо запит на сервер для збереження
        await fetch(`/article-save/${articleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Title: newTitle, Text: newContent }),
        });
        exitEditMode(); // Вихід з режиму редагування
    });

    const resetButton = document.createElement('button');
    resetButton.className = 'btn-reset';
    resetButton.innerText = 'Cancel';
    resetButton.addEventListener('click', async () => {
        await fetch(`/articles/${articleId}`).then(html => { document.body.innerHTML = html; });;
    });

    applyChanges.appendChild(saveButton);
    applyChanges.appendChild(resetButton);
}

function exitEditMode() {
    const mainText = document.querySelector('.main-text');
    const title = document.getElementById('title');
    mainText.setAttribute('contenteditable', 'false');
    title.setAttribute('contenteditable', 'false');
    const saveButton = document.querySelector('.btn-save');
    const resetButton = document.querySelector('.btn-reset');
    saveButton.parentNode.removeChild(saveButton);
    resetButton.parentNode.removeChild(resetButton);
    isEditMode = false;
}