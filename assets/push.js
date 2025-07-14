(async () => {
    const messages = await fetch('assets/messages.json').then(res => res.json());

    const minMinutes = 1;
    const maxMinutes = 5;
    function getRandomDelay() {
        const min = minMinutes * 60 * 1000;
        const max = maxMinutes * 60 * 1000;
        return Math.random() * (max - min) + min;
    }

    function scheduleNext() {
        const delay = getRandomDelay();
        setTimeout(() => {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        new Notification(msg.title, {
            body: msg.body,
            icon: '/assets/icons/favicon_colored.png'
        });
        scheduleNext();
        }, delay);
    }

    if (Notification.permission === 'granted') {
        scheduleNext();
        console.log('Notification permission GRANTED');
        document.getElementById('pushRequestInstallD').style.display = 'none';
        document.getElementById('pushRequestLandingD').style.display = 'none';
        document.getElementById('pushRequest').style.display = 'none';
        document.getElementById('pushRequestInstall').style.display = 'none';
        document.getElementById('pushRequestLanding').style.display = 'none';
        document.getElementById('pushRequest').style.display = 'none';
    } else {
        console.log('Notification permission DENIED or DEFAULT');
    }
})();

document.getElementById('pushRequest').addEventListener('click', async () => {
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
        new Notification("Success!", {
            body: "You enabled push notifications!",
            icon: '/assets/icons/favicon_colored.png'
        });
        } else {
        alert("Notifications were rejected or ignored.");
        }

    } else if (Notification.permission === 'granted') {
        new Notification("Already activated!", {
        body: "You are already receiving notifications.",
        icon: '/assets/icons/favicon_colored.png'
        });

    } else {
        alert("Notifications were previously rejected. You have to change the permission manually in the browser.");
    }
});

document.getElementById('pushRequestInstall').addEventListener('click', async () => {
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
        new Notification("Success!", {
            body: "You enabled push notifications!",
            icon: '/assets/icons/favicon_colored.png'
        });
        } else {
        alert("Notifications were rejected or ignored.");
        }

    } else if (Notification.permission === 'granted') {
        new Notification("Already activated!", {
        body: "You are already receiving notifications.",
        icon: '/assets/icons/favicon_colored.png'
        });

    } else {
        alert("Notifications were previously rejected. You have to change the permission manually in the browser.");
    }
});

document.getElementById('pushRequestLanding').addEventListener('click', async () => {
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
        new Notification("Success!", {
            body: "You enabled push notifications!",
            icon: '/assets/icons/favicon_colored.png'
        });
        } else {
        alert("Notifications were rejected or ignored.");
        }

    } else if (Notification.permission === 'granted') {
        new Notification("Already activated!", {
        body: "You are already receiving notifications.",
        icon: '/assets/icons/favicon_colored.png'
        });

    } else {
        alert("Notifications were previously rejected. You have to change the permission manually in the browser.");
    }
});