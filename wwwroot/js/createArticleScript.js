const text = document.getElementById('title');
const treeLeft = document.getElementById('tree-left');
const treeRight = document.getElementById('tree-right');
const gateLeft = document.getElementById('gate-left');
const gateRight = document.getElementById('gate-right');
const btnSave = document.querySelector(".btn-save");

document.querySelector('.main-text').addEventListener('input', () =>{
    const mainText = document.getElementById('main-text').innerText;
    const formattedMainText = mainText.replace(/\n/g, '@@@');
    console.log(formattedMainText)
});

btnSave.addEventListener('click', async () => {
    const title = document.getElementById('title').innerText;
    const mainText = document.getElementById('main-text').innerText;
    const formattedMainText = mainText.replace(/\n/g, '@@@');
    const data = {
        Title: title,
        MainText: formattedMainText
    };
    console.log(formattedMainText);
    await fetch("/create-article", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    window.location.href = "/";
});

window.addEventListener('scroll', () => {
    let value = window.scrollY;
    text.style.marginTop = Math.min(Math.max(value * 2.5, 0), 800) + 'px';
    treeLeft.style.left = Math.min(Math.max(value * -1.5, -800), 800) + 'px';
    treeRight.style.left = Math.min(Math.max(value * 1.5, -800), 800) + 'px';
    gateLeft.style.left = Math.min(Math.max(value * 0.5, -800), 800) + 'px';
    gateRight.style.left = Math.min(Math.max(value * -0.5, -800), 800) + 'px';
})