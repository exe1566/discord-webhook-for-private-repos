const discord = require('discord.js')
const MAX_MESSAGE_LENGTH = 900

module.exports.send = (id, token, repo, branch, url, commits, size, report) => new Promise((resolve, reject) => {
    var client
    console.log("Preparing Webhook...")
    try {
        client = new discord.WebhookClient(id, token)
    }
    catch (error) {
        reject(error.message)
        return
    }

    client.send(createEmbed(repo, branch, url, commits, size, report)).then(() => {
        console.log("Successfully sent the message!")
        if (commits[0].message.split('\n')[0].includes('['))
        {
            client.send("@everyone")
        }
        resolve()
    }, reject)
})

function createEmbed(repo, branch, url, commits, size, report) {
    console.log("Constructing Embed...")
    var latest = commits[0]

    var embed = new discord.RichEmbed()
        .setColor('#00ffff')
        //.setTitle(size + (size == 1 ? " Commit was " : " Commits were ") + "added to " + repo + " (" + branch + ")")
        .setTitle("[" +  commits[0].id.substring(0, 6) + "] " + commits[0].message.split('\n')[0])
        .setDescription(getChangeLog(commits, size))
        .setTimestamp(Date.parse(latest.timestamp))
        .setFooter(`⚡ Değişiklilikler @${commits[0].author.username} tarafından yapıldı`, commits[0].author.avatar_url)
        .setThumbnail("https://media.discordapp.net/attachments/845422148838621274/952911660962697236/IMG_1980.png?width=503&height=671")
        //.setImage('https://media.discordapp.net/attachments/565279540906033153/853390386734825492/logo.png?width=502&height=670')
    if (report.tests.length > 0) { appendTestResults(embed, report) }
    return embed
}

function getChangeLog(commits, size) {
    var changelog = ""
    for (var i in commits) {
        if (i > 4) {
            changelog += `+ ${size - i} more...\n`
            break
        }

        var commit = commits[i];
        var message = commit.message.length > MAX_MESSAGE_LENGTH ? (commit.message.substring(0, MAX_MESSAGE_LENGTH) + "..."): commit.message
        
        var lines = message.split('\n');
        lines.splice(0,1);
        var newtext = lines.join('\n');

        changelog += newtext
    }

    return changelog
}
/*
*
*
*
*  Ignore that, I delete soon.
*
*
*
*/
function getEmbedColor(report) {
    if (report.status === "FAILURE") {
        return 0x00BB22
    }

    if (report.tests.length > 0) {
        var skipped = 0
        var failures = 0

        for (var i in report.tests) {
            var status = report.tests[i].status
            if (status === "SKIPPED") skipped++
            if (status === "FAILURE" || status === "ERROR") failures++
        }

        if (failures > 0) {
            return 0xFF6600
        }
        if (skipped > 0) {
            return 0xFF9900
        }

        return 0x00FF00
    }
    else {
        return 0x00BB22
    }
}

function appendTestResults(embed, report) {
    var title = false
    var passes = 0
    var skipped = 0
    var failures = []

    for (var i in report.tests) {
        var status = report.tests[i].status
        if (status === "OK") passes++
        else if (status === "SKIPPED") skipped++
        else failures.push(report.tests[i].name)
    }

    var tests = ""
    if (passes > 0) {
        tests += ` :green_circle: ${passes} Tests passed`
    }
    if (skipped > 0) {
        tests += ` :yellow_circle: ${skipped} Tests were skipped`
    }

    if (failures.length > 0) {
        tests += ` :red_circle: ${failures.length} Tests failed\n`

        for (var i in failures) {
            if (i > 2) {
                tests += `\n+ ${failures.length - i} more...`
                break
            }
            tests += `\n${parseInt(i) + 1}. \`${failures[i]}\``
        }
    }
    embed.addField("Unit Tests" + (failures > 0 ? "": ` (~${report.coverage}% coverage):`), tests)
}
