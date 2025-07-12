const SUPABASE_URL = 'https://srzzqcdclmxojyqruhwp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyenpxY2RjbG14b2p5cXJ1aHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDc4ODgsImV4cCI6MjA2NzgyMzg4OH0.82nuiJjhrWh106-vSTek-xpDMR2Knw2yqc91We-GFB4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
	headers: {
		'apikey': SUPABASE_KEY,
		'Authorization': `Bearer ${SUPABASE_KEY}`
	}
});

const sections = {
	profile: document.getElementById('section-profile'),
	personal: document.getElementById('section-personal'),
	local: document.getElementById('section-local')
};

const navButtons = document.querySelectorAll('nav button');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const avatarImg = document.getElementById('avatar');
const usernameSpan = document.getElementById('username');
const userEmailSpan = document.getElementById('email');

const pList = document.getElementById('personal-list');
const pInput = document.getElementById('personal-input');
const pAdd = document.getElementById('personal-add');
const pCategorySelect = document.createElement('select');
const pCategoryAddBtn = document.createElement('button');

const lList = document.getElementById('local-list');
const lInput = document.getElementById('local-input');
const lAdd = document.getElementById('local-add');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const lCategorySelect = document.createElement('select');
const lCategoryAddBtn = document.createElement('button');

let currentUser = null;
let personalChannel = null;
let localItems = {};

navButtons.forEach(btn => {
	btn.addEventListener('click', () => {
		navButtons.forEach(b => b.classList.remove('active'));
		btn.classList.add('active');

		Object.values(sections).forEach(s => s.classList.remove('active'));
		sections[btn.dataset.sec].classList.add('active');
	});
});

loginBtn.addEventListener('click', () => {
	const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	const redirectTo = isLocalhost ? window.location.origin : 'https://philipp-dachtler.github.io';

	supabase.auth.signInWithOAuth({
		provider: 'discord',
		options: {
			redirectTo
		}
	});
});

logoutBtn.addEventListener('click', () => supabase.auth.signOut());

supabase.auth.onAuthStateChange((event, session) => {
	if (session?.user) {
		currentUser = session.user;
		showProfile(session.user);
		loadPersonal();
		document.querySelector('[data-sec="personal"]').click();

		// Realtime-Abonnement für persönliche Liste
		if (personalChannel) {
			supabase.removeChannel(personalChannel);
		}

		personalChannel = supabase.channel(`personal-${session.user.id}`)
			.on('postgres_changes', {
				event: 'UPDATE',
				schema: 'public',
				table: 'personal',
				filter: `user_id=eq.${session.user.id}`
			}, () => loadPersonal())
			.subscribe();

	} else {
		currentUser = null;
		hideProfile();
		sections.profile.classList.add('active');
		navButtons[2].classList.add('active');

		// Channel beenden bei Abmeldung
		if (personalChannel) {
			supabase.removeChannel(personalChannel);
			personalChannel = null;
		}
	}
});

(async () => {
	const {
		data: {
			session
		}
	} = await supabase.auth.getSession();

	if (session?.user) {
		currentUser = session.user;
		showProfile(session.user);
		loadPersonal();
		document.querySelector('[data-sec="personal"]').click();

		// Realtime-Abonnement initialisieren
		personalChannel = supabase.channel(`personal-${session.user.id}`)
			.on('postgres_changes', {
				event: 'UPDATE',
				schema: 'public',
				table: 'personal',
				filter: `user_id=eq.${session.user.id}`
			}, () => loadPersonal())
			.subscribe();

	} else {
		sections.profile.classList.add('active');
		navButtons[2].classList.add('active');
	}
})();

function showProfile(user) {
	const discordName = user.user_metadata.full_name || user.user_metadata.user_name || user.email.split('@')[0];

	avatarImg.src = user.user_metadata.avatar_url;
	usernameSpan.textContent = discordName;
	userEmailSpan.textContent = user.email;
	userInfo.classList.remove('hidden');
	loginBtn.classList.add('hidden');
	logoutBtn.classList.remove('hidden');
}

function hideProfile() {
	userInfo.classList.add('hidden');
	loginBtn.classList.remove('hidden');
	logoutBtn.classList.add('hidden');
}

async function loadPersonal() {
	if (!currentUser) return;

	try {
		let items = {};

		const {
			data,
			error
		} = await supabase
			.from('personal')
			.select('items')
			.eq('user_id', currentUser.id)
			.single();

		if (error?.code === 'PGRST116') {
			const {
				error: insertError
			} = await supabase
				.from('personal')
				.insert({
					user_id: currentUser.id,
					items: {}
				});

			if (insertError) throw insertError;
		} else if (error) {
			throw error;
		} else {
			items = data.items || {};
		}

		renderPersonalList(items);
	} catch (error) {
		console.error('Fehler beim Laden der persönlichen Liste:', error + error.message);
	}
}

function renderPersonalList(items) {
	pList.innerHTML = '';

	if (Object.keys(items).length === 0) {
		pList.innerHTML = ` <div class="empty-state"><p>Noch keine Artikel hinzugefügt</p></div>`;
		return;
	}

	pCategorySelect.innerHTML = '';

	Object.keys(items).forEach(category => {
		const option = document.createElement('option');
		option.value = category;
		option.textContent = category;
		pCategorySelect.appendChild(option);
	});

	Object.entries(items).forEach(([category, entries]) => {
		const categoryDiv = document.createElement('div');
		categoryDiv.className = 'category';

		const header = document.createElement('div');
		header.className = 'category-header';
		header.innerHTML = `<h3>${category}</h3>
								<div>
									<button class="edit-category-btn" onclick="editPersonalCategory('${category}')" >
										<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080">
											<path d="m490-527 37 37 217-217-37-37-217 217ZM200-200h37l233-233-37-37-233 233v37Zm355-205L405-555l167-167-29-29-219 219-56-56 218-219q24-24 56.5-24t56.5 24l29 29 50-50q12-12 28.5-12t28.5 12l93 93q12 12 12 28.5T828-678L555-405ZM270-120H120v-150l285-285 150 150-285 285Z"/>
										</svg>
									</button>
									<button class="delete-category-btn" onclick="deletePersonalCategory('${category}')" >
										<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#FA5D88">
											<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
										</svg>
									</button>
								</div>`;

		const ul = document.createElement('ul');
		ul.className = 'category-items';

		if (entries.length === 0) {
			ul.innerHTML = `<li class="empty" >Keine Einträge</li>`;
		} else {
			entries.forEach((it, idx) => {
				const li = document.createElement('li');
				li.classList.toggle('done', it.done);
				li.innerHTML = ` <span>${it.name}</span>
										<div>
											<button class="action-btn" onclick="editPersonalItem('${category}', ${idx})" >
												<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080">
													<path d="m490-527 37 37 217-217-37-37-217 217ZM200-200h37l233-233-37-37-233 233v37Zm355-205L405-555l167-167-29-29-219 219-56-56 218-219q24-24 56.5-24t56.5 24l29 29 50-50q12-12 28.5-12t28.5 12l93 93q12 12 12 28.5T828-678L555-405ZM270-120H120v-150l285-285 150 150-285 285Z"/>
												</svg>
											</button>
											<button class="action-btn" onclick="togglePersonal('${category}', ${idx})" >${it.done ? '<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>'}</button>
											<button class="action-btn" onclick="removePersonal('${category}', ${idx})" >
												<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#FA5D88">
													<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
												</svg>
											</button>
										</div> `;
				ul.appendChild(li);
			});
		}

		categoryDiv.appendChild(header);
		categoryDiv.appendChild(ul);
		pList.appendChild(categoryDiv);
	});
}

const pInputContainer = document.querySelector('#section-personal .input-row');
pCategorySelect.id = 'personal-category-select';
pCategoryAddBtn.id = 'personal-category-add';
pCategoryAddBtn.textContent = 'Neue Kategorie hinzufügen';
pCategoryAddBtn.title = 'Kategorie hinzufügen';

pInputContainer.insertBefore(pCategorySelect, pInput);
pInputContainer.insertBefore(pCategoryAddBtn, pInput);

pCategoryAddBtn.addEventListener('click', addPersonalCategory);
pAdd.addEventListener('click', addPersonalItem);

pInput.addEventListener('keypress', e => {
	if (e.key === 'Enter') addPersonalItem();
});

async function addPersonalCategory() {
	const name = prompt('Name der neuen Kategorie:');
	if (!name) return;

	try {
		const {
			data,
			error
		} = await supabase.from('personal').select('items').eq('user_id', currentUser.id).single();
		if (error) throw error;

		let items = data?.items || {};

		if (items[name]) {
			alert('Kategorie existiert bereits!');
			return;
		}

		items[name] = [];

		const {
			error: updateError
		} = await supabase.from('personal').update({
			items
		}).eq('user_id', currentUser.id);
		if (updateError) throw updateError;

		loadPersonal();
	} catch (error) {
		console.error(error);
	}
}

window.editPersonalCategory = async (oldName) => {
	const newName = prompt('Neuer Name der Kategorie:', oldName);
	if (!newName || newName === oldName) return;

	try {
		const {
			data,
			error
		} = await supabase.from('personal').select('items').eq('user_id', currentUser.id).single();
		if (error) throw error;

		let items = data.items;

		if (items[newName]) {
			alert('Kategorie existiert bereits!');
			return;
		}

		items[newName] = items[oldName];
		delete items[oldName];

		const {
			error: updateError
		} = await supabase.from('personal').update({
			items
		}).eq('user_id', currentUser.id);
		if (updateError) throw updateError;

		loadPersonal();
	} catch (error) {
		console.error(error);
	}
};

window.deletePersonalCategory = async (category) => {
	if (!confirm(`Möchtest du die Kategorie "${category}" und alle ihre Einträge löschen?`)) return;

	try {
		const {
			data,
			error
		} = await supabase.from('personal').select('items').eq('user_id', currentUser.id).single();
		if (error) throw error;

		let items = data.items;
		delete items[category];

		const {
			error: updateError
		} = await supabase.from('personal').update({
			items
		}).eq('user_id', currentUser.id);
		if (updateError) throw updateError;

		loadPersonal();
	} catch (error) {
		console.error(error);
	}
};

window.editPersonalItem = async (category, idx) => {
	const {
		data,
		error
	} = await supabase.from('personal').select('items').eq('user_id', currentUser.id).single();
	if (error) return;

	const items = data.items;
	const newName = prompt('Neuer Artikelname:', items[category][idx].name);
	if (!newName) return;

	items[category][idx].name = newName;

	const {
		error: updateError
	} = await supabase.from('personal').update({
		items
	}).eq('user_id', currentUser.id);
	if (updateError) return;

	loadPersonal();
};

async function addPersonalItem() {
	const name = pInput.value.trim();
	if (!name) return;

	const category = pCategorySelect.value;
	if (!category) return;

	try {
		const {
			data,
			error
		} = await supabase.from('personal').select('items').eq('user_id', currentUser.id).single();
		if (error) throw error;

		let items = data?.items || {};
		if (!items[category]) items[category] = [];

		items[category].push({
			name,
			done: false
		});

		const {
			error: updateError
		} = await supabase.from('personal').update({
			items
		}).eq('user_id', currentUser.id);
		if (updateError) throw updateError;

		pInput.value = '';
		loadPersonal();
	} catch (error) {
		console.error(error);
	}
}

window.togglePersonal = async (category, idx) => {
	try {
		const {
			data,
			error
		} = await supabase.from('personal').select('items').eq('user_id', currentUser.id).single();
		if (error) throw error;

		data.items[category][idx].done = !data.items[category][idx].done;

		const {
			error: updateError
		} = await supabase.from('personal').update({
			items: data.items
		}).eq('user_id', currentUser.id);
		if (updateError) throw updateError;

		loadPersonal();
	} catch (error) {
		console.error(error);
	}
};

window.removePersonal = async (category, idx) => {
	try {
		const {
			data,
			error
		} = await supabase.from('personal').select('items').eq('user_id', currentUser.id).single();
		if (error) throw error;

		data.items[category].splice(idx, 1);

		if (data.items[category].length === 0) {
			delete data.items[category];
		}

		const {
			error: updateError
		} = await supabase.from('personal').update({
			items: data.items
		}).eq('user_id', currentUser.id);
		if (updateError) throw updateError;

		loadPersonal();
	} catch (error) {
		console.error(error);
	}
};

function loadLocalList() {
	const saved = localStorage.getItem('localShoppingList');
	localItems = saved ? JSON.parse(saved) : {};

	// Migration von alter Struktur
	if (Array.isArray(localItems)) {
		localItems = {
			"Allgemein": localItems
		};
		saveLocalList(localItems);
	}

	renderLocalList(localItems);
}

function renderLocalList(items) {
	lList.innerHTML = '';

	if (Object.keys(items).length === 0) {
		lList.innerHTML = ` <div class="empty-state"><p>Noch keine Artikel hinzugefügt</p></div>`;
		return;
	}

	lCategorySelect.innerHTML = '';

	Object.keys(items).forEach(category => {
		const option = document.createElement('option');
		option.value = category;
		option.textContent = category;
		lCategorySelect.appendChild(option);
	});

	Object.entries(items).forEach(([category, entries]) => {
		const categoryDiv = document.createElement('div');
		categoryDiv.className = 'category';

		const header = document.createElement('div');
		header.className = 'category-header';
		header.innerHTML = ` <h3>${category}</h3>
								<div>
									<button class="edit-category-btn" onclick="editLocalCategory('${category}')" >
												<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080">
													<path d="m490-527 37 37 217-217-37-37-217 217ZM200-200h37l233-233-37-37-233 233v37Zm355-205L405-555l167-167-29-29-219 219-56-56 218-219q24-24 56.5-24t56.5 24l29 29 50-50q12-12 28.5-12t28.5 12l93 93q12 12 12 28.5T828-678L555-405ZM270-120H120v-150l285-285 150 150-285 285Z"/>
												</svg>
											</button>
									<button class="delete-category-btn" onclick="deleteLocalCategory('${category}')" >
										<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#FA5D88">
											<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
										</svg>
									</button>
								</div> `;

		const ul = document.createElement('ul');
		ul.className = 'category-items';

		if (entries.length === 0) {
			ul.innerHTML = `<li class="empty" >Keine Einträge</li>`;
		} else {
			entries.forEach((it, idx) => {
				const li = document.createElement('li');
				li.classList.toggle('done', it.done);
				li.innerHTML = ` <span>${it.name}</span>
										<div>
											<button class="action-btn" onclick="editLocalItem('${category}', ${idx})" >
												<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080">
													<path d="m490-527 37 37 217-217-37-37-217 217ZM200-200h37l233-233-37-37-233 233v37Zm355-205L405-555l167-167-29-29-219 219-56-56 218-219q24-24 56.5-24t56.5 24l29 29 50-50q12-12 28.5-12t28.5 12l93 93q12 12 12 28.5T828-678L555-405ZM270-120H120v-150l285-285 150 150-285 285Z"/>
												</svg>
											</button>
											<button class="action-btn" onclick="toggleLocal('${category}', ${idx})" >${it.done ? '<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#808080"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>'}</button>
											<button class="action-btn" onclick="removeLocal('${category}', ${idx})" >
												<svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 -960 960 960" width="25" fill="#FA5D88">
													<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
												</svg>
											</button>
										</div> `;
				ul.appendChild(li);
			});
		}

		categoryDiv.appendChild(header);
		categoryDiv.appendChild(ul);
		lList.appendChild(categoryDiv);
	});
}

function saveLocalList(items) {
	localItems = items;
	localStorage.setItem('localShoppingList', JSON.stringify(items));
	renderLocalList(items);
}

const lInputContainer = document.querySelector('#section-local .input-row');
lCategorySelect.id = 'local-category-select';
lCategoryAddBtn.id = 'local-category-add';
lCategoryAddBtn.textContent = 'Neue Kategorie hinzufügen';
lCategoryAddBtn.title = 'Kategorie hinzufügen';

lInputContainer.insertBefore(lCategorySelect, lInput);
lInputContainer.insertBefore(lCategoryAddBtn, lInput);

lCategoryAddBtn.addEventListener('click', addLocalCategory);
lAdd.addEventListener('click', addLocalItem);

lInput.addEventListener('keypress', e => {
	if (e.key === 'Enter') lAdd.click();
});

function addLocalCategory() {
	const name = prompt('Name der neuen Kategorie:');
	if (!name) return;

	const saved = localStorage.getItem('localShoppingList');

	let items = saved ? JSON.parse(saved) : {};

	if (items[name]) {
		alert('Kategorie existiert bereits!');
		return;
	}

	items[name] = [];
	saveLocalList(items);
}

window.editLocalCategory = (oldName) => {
	const newName = prompt('Neuer Name der Kategorie:', oldName);
	if (!newName || newName === oldName) return;

	const saved = localStorage.getItem('localShoppingList');

	let items = saved ? JSON.parse(saved) : {};

	if (items[newName]) {
		alert('Kategorie existiert bereits!');
		return;
	}

	items[newName] = items[oldName];
	delete items[oldName];
	saveLocalList(items);
};

window.deleteLocalCategory = (category) => {
	if (!confirm(`Möchtest du die Kategorie "${category}" und alle ihre Einträge löschen?`)) return;

	const saved = localStorage.getItem('localShoppingList');

	let items = saved ? JSON.parse(saved) : {};

	delete items[category];
	saveLocalList(items);
};

window.editLocalItem = (category, idx) => {
	const saved = localStorage.getItem('localShoppingList');

	let items = saved ? JSON.parse(saved) : {};

	const newName = prompt('Neuer Artikelname:', items[category][idx].name);
	if (!newName) return;

	items[category][idx].name = newName;
	saveLocalList(items);
};

function addLocalItem() {
	const name = lInput.value.trim();
	if (!name) return;

	const category = lCategorySelect.value;
	if (!category) return;

	const saved = localStorage.getItem('localShoppingList');

	let items = saved ? JSON.parse(saved) : {};

	if (!items[category]) items[category] = [];

	items[category].push({
		name,
		done: false
	});

	saveLocalList(items);
	lInput.value = '';
}

window.toggleLocal = (category, idx) => {
	const saved = localStorage.getItem('localShoppingList');

	let items = saved ? JSON.parse(saved) : {};

	items[category][idx].done = !items[category][idx].done;
	saveLocalList(items);
};

window.removeLocal = (category, idx) => {
	const saved = localStorage.getItem('localShoppingList');

	let items = saved ? JSON.parse(saved) : {};

	items[category].splice(idx, 1);

	if (items[category].length === 0) {
		delete items[category];
	}

	saveLocalList(items);
};

exportBtn.addEventListener('click', () => {
	const items = JSON.parse(localStorage.getItem('localShoppingList')) || {};
	const jsonStr = JSON.stringify(items, null, 2);

	const blob = new Blob([jsonStr], {
		type: 'application/json'
	});
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = 'local_cart.json';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';

	input.onchange = e => {
		const file = e.target.files[0];
		const reader = new FileReader();

		reader.onload = event => {
			try {
				const items = JSON.parse(event.target.result);

				if (typeof items !== 'object' || Array.isArray(items)) {
					throw new Error('Ungültiges Format - Erwartet ein Objekt mit Kategorien');
				}

				saveLocalList(items);
				alert('Liste erfolgreich importiert!');
			} catch (error) {
				alert('Fehler beim Import: ' + error.message);
			}
		};

		reader.readAsText(file);
	};

	input.click();
});

// Realtime-Aktualisierung für lokale Liste (cross-tab)
window.addEventListener('storage', (event) => {
	if (event.key === 'localShoppingList') {
		loadLocalList();
	}
});

// Initialisierung
loadLocalList();

// Intervall-Check für lokale Liste (Fallback)
setInterval(() => {
	const saved = localStorage.getItem('localShoppingList');
	if (saved && saved !== JSON.stringify(localItems)) {
		loadLocalList();
	}
}, 3000);

// Navigation-Indikator
document.querySelectorAll('.nav-btn').forEach(button => {
	button.addEventListener('click', function() {
		document.querySelectorAll('.nav-btn').forEach(btn => {
			btn.classList.remove('active');
		});
		this.classList.add('active');

		const nav = document.querySelector('.modern-nav');
		const indicator = document.querySelector('.active-indicator');
		const buttons = document.querySelectorAll('.nav-btn');
		const index = Array.from(buttons).indexOf(this);

		const navPadding = parseFloat(getComputedStyle(nav).paddingLeft);
		const navWidth = nav.offsetWidth - (navPadding * 2);
		const buttonWidth = navWidth / buttons.length;

		const indicatorLeft = (index * buttonWidth) + navPadding;
		const indicatorWidth = buttonWidth;

		indicator.style.left = `${indicatorLeft}px`;
		indicator.style.width = `${indicatorWidth}px`;
	});
});

document.addEventListener('DOMContentLoaded', () => {
	const activeButton = document.querySelector('.nav-btn.active');
	if (activeButton) {
		activeButton.click();
	} else {
		const nav = document.querySelector('.modern-nav');
		const indicator = document.querySelector('.active-indicator');
		const buttons = document.querySelectorAll('.nav-btn');

		if (buttons.length > 0) {
			const navPadding = parseFloat(getComputedStyle(nav).paddingLeft);
			const navWidth = nav.offsetWidth - (navPadding * 2);
			const buttonWidth = navWidth / buttons.length;

			indicator.style.left = `${navPadding}px`;
			indicator.style.width = `${buttonWidth}px`;
		}
	}
});

window.addEventListener('resize', () => {
	const activeButton = document.querySelector('.nav-btn.active');
	if (activeButton) activeButton.click();
});