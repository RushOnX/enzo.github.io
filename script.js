const secretKey = 'bXktc2VjcmV0LWtleQ=='; // Change this to a securely generated key
const webhookURL = 'https://discord.com/api/webhooks/1253724037377429566/BFOuOmVonPhTGSitx6zQaoW9Zr6VJW3gv-65wrR7aMug8hP10zKQoKPgdSroiuotr-BJ';

function encrypt(data) {
    return CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(secretKey), { mode: CryptoJS.mode.ECB }).toString();
}

function decrypt(data) {
    const bytes = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(secretKey), { mode: CryptoJS.mode.ECB });
    return bytes.toString(CryptoJS.enc.Utf8);
}

function toggleForm() {
    const overlay = document.getElementById('overlay');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const profileSettings = document.getElementById('profile-settings');
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    profileSettings.style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function togglePasswordVisibility(id) {
    const passwordInput = document.getElementById(id);
    const eyeIcon = document.getElementById(id + '-eye');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.src = 'eye-open.png';
    } else {
        passwordInput.type = 'password';
        eyeIcon.src = 'eye-closed.png';
    }
}

function validateLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorMessage = document.getElementById('login-error-message');

    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username] && decrypt(users[username].password) === password) {
        localStorage.setItem('currentUser', username);
        alert('Connexion réussie');
        toggleForm();
        showProfileSection();
        return false;
    } else {
        errorMessage.textContent = 'Nom d\'utilisateur ou mot de passe incorrect';
        return false;
    }
}

function registerUser() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorMessage = document.getElementById('register-error-message');

    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username]) {
        errorMessage.textContent = 'Nom d\'utilisateur déjà pris';
        return false;
    } else {
        users[username] = { email: encrypt(email), password: encrypt(password), profilePic: 'default-profile.png' };
        localStorage.setItem('users', JSON.stringify(users));
        alert('Inscription réussie');
        showLoginForm();
        return false;
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chat-input').value;
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users'));

    if (!currentUser || !users[currentUser]) {
        alert('Vous devez être connecté pour envoyer des messages.');
        return false;
    }

    const chatMessage = {
        user: currentUser,
        message: chatInput,
        timestamp: new Date().toISOString()
    };

    const payload = {
        content: `${chatMessage.user}: ${chatMessage.message}`
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            let chatMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
            chatMessages.push(chatMessage);
            localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
            loadChatMessages();
            document.getElementById('chat-input').value = '';
        } else {
            alert('Erreur lors de l\'envoi du message.');
        }
    })
    .catch(error => {
        alert('Erreur lors de l\'envoi du message.');
    });

    return false;
}

function loadChatMessages() {
    const chatMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const chatMessagesDiv = document.getElementById('chat-messages');
    chatMessagesDiv.innerHTML = '';

    chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.innerHTML = `<p><strong>${msg.user}:</strong> ${msg.message} <small>${new Date(msg.timestamp).toLocaleTimeString()}</small></p>`;
        chatMessagesDiv.appendChild(messageDiv);
    });

    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

function showProfileSection() {
    const profilePicSmall = document.getElementById('profile-pic-small');
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users'));

    if (currentUser && users[currentUser]) {
        profilePicSmall.src = users[currentUser].profilePic;
        document.getElementById('toggle-button').classList.add('hidden');
        profilePicSmall.classList.remove('hidden');
        document.getElementById('overlay').style.display = 'none';
    }
}

function updateProfilePic() {
    const profilePicUpload = document.getElementById('profile-pic-upload');
    const profilePic = document.getElementById('profile-pic');
    const profilePicSmall = document.getElementById('profile-pic-small');
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users'));

    if (profilePicUpload.files && profilePicUpload.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            profilePic.src = e.target.result;
            profilePicSmall.src = e.target.result;
            users[currentUser].profilePic = e.target.result;
            localStorage.setItem('users', JSON.stringify(users));
        };
        reader.readAsDataURL(profilePicUpload.files[0]);
    }
}

function toggleProfileMenu() {
    const profileMenu = document.getElementById('profile-menu');
    profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

function deleteAccount() {
    const currentUser = localStorage.getItem('currentUser');
    let users = JSON.parse(localStorage.getItem('users'));
    delete users[currentUser];
    localStorage.setItem('users', JSON.stringify(users));
    logout();
}

document.addEventListener('DOMContentLoaded', function() {
    if (isLoggedIn()) {
        showProfileSection();
        loadChatMessages();
    }
    setInterval(loadChatMessages, 5000);
});

function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}
