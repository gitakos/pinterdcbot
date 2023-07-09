const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sugas')
		.setDescription('Súgj Pintérnek, és lehet vissza fogod hallani sugallatod!')
        .addStringOption(option =>
            option.setName('sugallat')
                .setDescription('Sugallatot ide kell beírni')
                .setRequired(true)),
	async execute(interaction) {
		//Ez soha nem fut le, a mentés miatt az index.js-be kell írnom az egész parancs kódját :/
		//viszont parancs regisztráció miatt itt marad ez a fálj (vagy ha meg tudom majd oldani hogy itt is eltudjam érni az adatbázist)
		await interaction.reply(interaction.options.getString('sugallat'));
	},
};