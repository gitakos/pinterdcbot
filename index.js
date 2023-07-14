require('dotenv').config();
const Sequelize = require('sequelize');
const { Client, IntentsBitField, GatewayIntentBits,Collection, Events,} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

let eselyFaktor = 10;
//let elozoBuffer = 10;
let valaszLista = [];

const client = new Client({
    //intents: ezek kb szabályok hogy milyen eventeket érhetsz el
    //https://discord.com/developers/docs/topics/gateway#list-of-intents
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions
    ]
});

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true, //Kapcsold ki ha idegesítenek az sql kiiratások
	// SQLite only
	storage: 'database.sqlite',
});

const Tags = sequelize.define('tags', {
    //Itt van egy láthatatlan id rész is, amit a sequalize csinál ide(nincs használva)
    szamlalo:{
        type: Sequelize.INTEGER,
		unique: true,
        allowNull: false,
    },
	uzenet: {
		type: Sequelize.TEXT,
		unique: true,
        allowNull: false,
	},
	bekuldo: Sequelize.STRING,
	usage_count: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

async function legnagyTagKereses()
{
    let legnagy = Tags.findOne({
        attributes: [[sequelize.fn('max',sequelize.col('szamlalo')),'szamlalo']],
        raw: true,
    })
    let eredmeny = await legnagy;
    //console.log(eredmeny.szamlalo+"!!!!!Legnagy",JSON.stringify(eredmeny, null, 2));
    return eredmeny;
}

let kovetkezoIndex = 0;
let soronKovetkezo = 0;

async function tablaKiiratas()
{
    const uzenetek = await Tags.findAll();
    console.log("Összes adat:", JSON.stringify(uzenetek, null, 2));
    return uzenetek.length;
}

async function tablaSync(){
    await Tags.sync();
}
let hossz = 0;

function keveres(honnan){
    if(valaszLista.length!=0)
    {
        valaszLista.splice(honnan+1,valaszLista.length-honnan-1);
    }
    while(valaszLista.length!=hossz)
    {
        let randomSzam = Math.floor(Math.random()*hossz);
        while(valaszLista.includes(randomSzam))
        {
            randomSzam = Math.floor(Math.random()*hossz);
        }
        valaszLista.push(randomSzam);
    }
    console.log(valaszLista);
}

client.on('ready',(c) => {
    tablaSync().then(
        function(){
            console.log(`${c.user.username} elindult!`);
            tablaKiiratas().then(
                function(value){
                    hossz = value;
                    console.log(hossz);
                    if(hossz>0)
                    {
                        keveres(0);
                        legnagyTagKereses().then(
                            function(value) {
                                if(value.szamlalo!==undefined)
                                {
                                    kovetkezoIndex = value.szamlalo+1;
                                }
                            }
                        );
                    }
                }
            );
        }
    );
});

async function randomUzenet(szam){
    //szam az az id-ja, csak a sequileznak nem akarom használni a saját id-ait
    let uzenet = await Tags.findOne({
        where: {szamlalo: szam}
    });
    console.log(uzenet.szamlalo+" az üzenet szamlalo-ja");
    return uzenet;
}

client.on('messageCreate', (msg) =>{
    if(msg.author.bot||hossz===0){
        return;
    }
    let esely = Math.floor(Math.random()*100)+1;
    if(msg.author.id === '427090020114104320')
    {
        if(msg.content==='Reset Pintér!')
        {
            Tags.sync({force: true}); //Reseteli az adatbazist
            hossz = 0;
            kovetkezoIndex = 0;
            return;
        }
        if(msg.content==='Eselyt fel!')
        {
            esely = 1;//Debug, garantált hogy válaszolni fog
        }
    }
    console.log(esely+" dobott ki");
    if(esely<=eselyFaktor)
    {
        randomUzenet(valaszLista[soronKovetkezo]).then(
            function(value){
                let uzenet = value.uzenet;
                console.log(uzenet+"| kiírva!");
                if(uzenet.includes('|'))
                {
                    uzenet = uzenet.replace('|',msg.author.username);
                }
                msg.reply(uzenet);
                soronKovetkezo++;
                if(soronKovetkezo==valaszLista.length)
                {
                    keveres(-1);
                    soronKovetkezo = 0;
                    console.log("Kifogytak az üzenetek, újra keverés ^^")
                }
            }
        );
    }
    //marci 627779817269624852
    /*if(msg.author.id === '627779817269624852')
    {
        msg.react('🤓')
    }*/
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`Error, ${filePath}-nak/nek nincs 'data' vagy 'execute' része, futás nem lett megállítva.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return; //Ha nem command interaction

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`Nincs ilyen command: ${interaction.commandName}`);
		return;
	}

    if(interaction.commandName === 'sugas')
    {
		const sugallat = interaction.options.getString('sugallat');
        // equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
        try {
            const tag = await Tags.create({
                szamlalo: kovetkezoIndex,
                uzenet: sugallat,
                bekuldo: interaction.user.username,
            });
            kovetkezoIndex++;
            hossz++;
            console.log(sugallat + ", Sugallat felvéve!");
            keveres(soronKovetkezo);
            console.log("Keverés eredménye ^^")
            return interaction.reply(`Pintér meghallotta a sugallatod.`);}
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return interaction.reply('Pintér már hallot ilyen sugallatot');
            }

            return interaction.reply('Túl halk voltál! (Error)');
        }
    }
    else
    {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Nem sikerült a parancsot lefuttatni!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Nem sikerült a parancsot lefuttatni!', ephemeral: true });
            }
        }
    }
});

client.login(process.env.TOKEN);