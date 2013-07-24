/* Events should have the following data in them
 *
 * - type: new comment? patchset? merge? abandon? what?
 * - user: Who did this?
 * - link: Link to the Gerrit patchset
 * - message: Generated message to display in quotes
 * - repo: displayable name of the repository
 * - branch: branch this was to, but on ly if it is not the default
 * - flags: C & V, only if they changed
 */

function filterNonDefault(branch) {
    return (branch !== 'master' && branch !== 'production') ? branch : undefined;
}

function formatRepo(repo) {
    return repo.replace(/^mediawiki\//, '');
}

exports['patchset-created'] = function(message) {
    var ret = {
        type: 'PS' + message.patchSet.number,
        user: message.uploader.name,
        'message': message.change.subject,
        repo: formatRepo(message.change.project),
        branch: filterNonDefault(message.change.branch),
        url: message.change.url
    }
    if(ret.user === 'SuchABot') {
        // Special handling for SuchABot
        ret.user = message.patchSet.author.name;
        ret.via = 'SuchABot';
    } else if(ret.user !== message.change.owner.name) {
        ret.owner = message.change.owner.name;
    }
    return ret;
}

exports['comment-added'] = function(message) {
    var ret = {
        type: 'CR',
        user: message.author.name,
        repo: formatRepo(message.change.project),
        branch: filterNonDefault(message.change.branch),
        url: message.change.url,
        owner: message.change.owner.name
    };
    var comment = message.comment.replace(/^\s*Patch Set \d+:.*$/m, '').trim().split("\n")[0].trim();
    if(!comment) {
        comment = message.change.subject.substring(0, 140);
    } else {
        comment = '"' + comment.substring(0, 138) + '"';
    }
    ret.message = comment;
    if(message.approvals) {
        ret.approvals = {};
        message.approvals.forEach(function(approval) {
            if(approval.type === 'Verified') {
                ret.approvals.V = approval.value;
            } else if (approval.type == 'Code-Review') {
                ret.approvals.C = approval.value;
            }
        });
    }
    if(ret.user === 'jenkins-bot') {
        ret.message = message.change.subject;
        if(!ret.approvals || ret.approvals.V > 0) {
            // Don't relay jenkins-bot comments that don't add negative approvals
            // Also don't add V+2 from jenkins bot, since it will merge right after
            // Customize to relay other messages that might be useful
            ret = undefined;
        }
    }
    return ret;
}

// For Merge, Restore and Abandon
function formatSimpleEvent(type, userProperty) {
    return function(message) {
        return {
            type: type,
            user: message[userProperty].name,
            'message': message.change.subject,
            repo: formatRepo(message.change.project),
            branch: filterNonDefault(message.change.branch),
            url: message.change.url,
            owner: message.change.owner.name
        };
    };
}

exports['change-merged'] = function(message) {
    var ret = formatSimpleEvent('Merged', 'submitter')(message);
    // Ignore any merges by anyone not jenkins-bot
    // This is always preceded by a C:2 by them, so we need not spam
    if(ret.user !== 'jenkins-bot') {
        ret = undefined;
    }
    return ret;
}

exports['change-restored'] = formatSimpleEvent('Restored', 'restorer');
exports['change-abandoned'] = formatSimpleEvent('Abandoned', 'abandoner');
