// Con este scrapper puedes buscar bots en la botlist (el scrapper te devuelve la información de los bots encontrados)

// Ejemplo de como usarlo:

/*

	const dtBotSearch = require("./botSearch.js");
	dtBotSearch("Bot sin nada que hacer")
		.then(bot => console.log(bots))
		.catch(err => console.log(err))

*/

const fetch = require("node-fetch");

const scrape = async (search = "") => {

	function formatHTML(text) { // Esto es para que sea 'opcional' incluir el módulo 'formatHTMLEntities.js' en tu proyecto
		try { return require("./formatHTMLEntities.js").decode(text); }
		catch { return text; }
	}

	function parseNumber(str) {
		if (isNaN(str)) return 0;
		else return parseInt(str);
	}

	function clearAvatarLink(str) {
		return (
			(str.indexOf("?size=") == -1) ? str : str.slice(0, str.indexOf("?size="))
		).replace(".webp", "");
	}

	if (!search) { throw "Invalid search term" }
	if (typeof search !== "string") { throw "Invalid search term, must be a string" }

	const body = await (await fetch("https://discordthings.com/search?q=" + encodeURIComponent(search) + "&page=1")).text();

	var pushString = "";
	var splitBody = [];

	body.split("").forEach(e => {
		if (e == "<") {
			if (pushString.trim()) splitBody.push(pushString.trim());
			pushString = e;
		} else if (e == ">") {
			pushString += e;
			splitBody.push(pushString.trim());
			pushString = "";
		} else pushString += e
	});

	if (body.includes('DiscordThings - 404')) { throw "Search term not found" }

	const botsIndexes = splitBody.map((e, i) => {
		if (e.includes('class="dthings-card__flex__banner')) return i;
	}).filter(e => e);

	const bots = botsIndexes.map(e => {
		
		const bodySliced = splitBody.slice(e);
		const votesInvites = bodySliced[bodySliced.findIndex(e => e.includes('class="dthings-card__flex__description"')) + 1].split(" | ");
		
		let avatar;
		try { avatar = formatHTML(splitBody[e + 2]).match(/https:.+"\)/g)[0].slice(0, -2); }
		catch { avatar = formatHTML(splitBody[e + 2]).match(/https:.+/g)[0]; }
		
		return {
			username: formatHTML(bodySliced[bodySliced.findIndex(e => e.includes('class="dthings-card__flex__username"')) + 1]),
			id: bodySliced.find(e => e.includes('<a style')).match(/\d{3,}/g)[0],
			avatar: clearAvatarLink(avatar),
			description: formatHTML(bodySliced[bodySliced.findIndex(e => e.includes('class="dthings-card__flex__sectionText"')) + 1]),
			votes: parseNumber(votesInvites[0].replace("Votos: ", "")),
			invites: parseNumber(votesInvites[1].replace("Invites: ", "")),
			botbug: bodySliced.slice(0, 10).join().includes("bugbot-dthings.png"),
			certified: bodySliced.slice(0, 10).join().includes("certifiedbot-dthings.png"),
		}

	});


	return bots;

}

module.exports = scrape;
