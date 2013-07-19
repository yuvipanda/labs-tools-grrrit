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

exports['patchset-created'] = function(message) {
    return {
        type: 'New PS' + message.patchSet.number,
        user: message.uploader.name,
        'message': message.change.subject,
        repo: message.change.project,
        branch: filterNonDefault(message.change.branch),
        url: message.change.url
    }
}

exports['comment-added'] = function(message) {
    var ret = {
        type: 'CR',
        user: message.author.name,
        'message': message.comment, // FIXME: Strip this
        repo: message.change.project,
        branch: filterNonDefault(message.change.branch),
        url: message.change.url
    };
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
        if(!ret.approvals || ret.approvals.V == 2) {
            // Don't relay jenkins-bot comments that don't add approvals
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
            repo: message.change.project,
            branch: filterNonDefault(message.change.branch),
            url: message.change.url
        };
    };
}

exports['change-merged'] = formatSimpleEvent('Merged', 'submitter');
exports['change-restored'] = formatSimpleEvent('Restored', 'restorer');
exports['change-abandoned'] = formatSimpleEvent('Abandoned', 'abandoner');
