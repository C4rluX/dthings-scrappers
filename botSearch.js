// Con este scrapper puedes buscar bots en la botlist por término de busqueda

// Ejemplo de como usarlo:

/*

	const dtBotSearch = require("./botSearch.js");
	dtBotSearch("Bot sin nada que hacer")
		.then(bot => console.log(bot))
		.catch(err => console.log(error))

*/

const botInfo = require("./botInfo.js"); // Si tienes el scrapper de bots en otro sitio, especificarlo aquí.
const fetch = require("node-fetch");

const scrape = async (search = "") => {

	if (!search) { throw "Invalid search term" }
	if (typeof search !== "string") { throw "Invalid search term, must be a string" }

	const response = await fetch("https://discordthings.com/search?q=" + encodeURIComponent(search) + "&page=1")
	const body = await response.text();

	var pushString = "";
	var splitBody = [];

	body.split("").map(e => {
		if (e == "<") {
			if (pushString.trim()) splitBody.push(pushString.trim());
			pushString = e;
		} else if (e == ">") {
			pushString += e;
			splitBody.push(pushString.trim());
			pushString = "";
		} else pushString += e
	});

	const pageTitle = splitBody[splitBody.indexOf("<title>") + 1];
	if (pageTitle.includes("Web server is down")) { throw "DiscordThings web server is down, maybe for maintenance" }
	if (pageTitle == "DiscordThings | 404") { throw "Search term not found" }

	const findedBot = splitBody.find(e => e.includes('<a title=') && e.includes('class="cardBtn1"'));
	if (!findedBot) { throw "Search term not found" }
		
	return await botInfo(findedBot.match(/\d{3,}/g)[0]);

}

module.exports = scrape;
