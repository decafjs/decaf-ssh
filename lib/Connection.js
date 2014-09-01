/**
 * Created with JetBrains WebStorm.
 * User: mschwartz
 * Date: 6/26/13
 * Time: 1:58 PM
 */

/** @module ssh */

var SSH = Packages.ch.ethz.ssh2,
    {File, BufferedReader, InputStreamReader} = java.io;

/**
 *
 * @param server
 * @param hosts
 * @constructor
 */
function Connection(server, hosts) {
    this.knownHosts = new SSH.KnownHosts();
    this.connection = new SSH.Connection(server);
    this.verifier = null;
    if (hosts) {
        this.addKnownHosts(hosts);
    }
}

decaf.extend(Connection.prototype, {
//        connect       : function() {
//            this.connection.connect(this.verifier);
//        },
    /**
     *
     * @param file
     */
    addKnownHosts: function (file) {
        var me = this;
        if (typeof file === 'string') {
            file = new File(file);
        }
        knownHosts.addHostkeys(file);
        this.verifier = new SSH.ServerHostKeyVerifier({
            verifyServerHostKey: function (hostname, port, serverHostKeyAlgorithm, serverHostKey) {
                var result = knownHosts.verifyHostkey(hostname, serverHostKeyAlgorithm, serverHostKey);
                switch (result) {
                    case SSHPKG.KnownHosts.HOSTKEY_IS_OK:
//                            debug("verifyServerHostKey", "received known host key, proceeding");
                        return true;
                    case SSHPKG.KnownHosts.HOSTKEY_IS_NEW:
                        if (paranoid == true) {
//                                debug("verifyServerHostKey", "received unknown host key, rejecting");
                            return false;
                        } else {
//                                debug("verifyServerHostKey", "received new host key, adding temporarily to known hosts ");
                            var hn = java.lang.reflect.Array.newInstance(java.lang.String, 1);
                            hn[0] = hostname;
                            knownHosts.addHostkey(hn, serverHostKeyAlgorithm, serverHostKey);
                            return true;
                        }
                    case SSHPKG.KnownHosts.HOSTKEY_HAS_CHANGED:
                        debug("verifyServerHostKey", "WARNING: host key has changed, rejecting");
                    default:
                        return false;
                }
                return;
            }
        });
    },

    /**
     *
     * @param username
     * @param password
     */
    connect: function (username, password) {
        if (!username || !password) {
            throw new Error('Insufficient arguments.');
        }
        else {
            this.connection.connect();
            this.connection.authenticateWithPassword(username, password);
        }
    },

    /**
     *
     * @param username
     * @param keyFile
     * @param passphrase
     */
    connectWithKey: function (username, keyFile, passphrase) {
        if (!username || !keyFile) {
            throw new Error('Insufficient arguments');
        }
        if (typeof keyFile === 'string') {
            keyFile = new File(keyFile);
        }
        this.connection.connect();
        this.connection.authenticateWithPublicKey(username, keyFile, passPhrase);
    },

    /**
     *
     */
    disconnect: function () {
        this.connection.close();
    },

    /**
     *
     * @returns {boolean|*}
     */
    isConnected: function () {
        return this.connection !== null && this.connection.isAuthenticationComplete();
    },

    /**
     *
     * @param localFile
     * @param remoteDir
     * @param mode
     */
    putFile: function (localFile, remoteDir, mode) {
        if (!localFile || !remoteDir) {
            throw new Error('Insufficient arguments');
        }
        var scp = this.connection.createSCPClient();
        if (mode) {
            scp.put(localFile, remoteDir, mode);
        }
        else {
            scp.put(localFile, remoteDir);
        }
    },

    /**
     *
     * @param remoteFile
     * @param targetDir
     */
    getFile: function (remoteFile, targetDir) {
        if (!remoteFile || !targetDir) {
            throw new Error('Insufficient arguments');
        }
        var scp = this.connection.createSCPClient();
        scp.get(remoteFile, targetDir);
    },

    /**
     *
     * @param cmd
     * @returns {string}
     */
    execCommand: function (cmd) {
        var session = this.connection.openSession();
        session.execCommand(cmd);
        var br = new BufferedReader(new InputStreamReader(new SSH.StreamGobbler(seesion.getStdout())));
        var stdout = '',
            line;
        while ((line = br.readLine())) {
            stdout += line + '\n';
        }
        session.close();
        return stdout;
    }
});

decaf.extend(exports, {
    Connection: Connection
});
