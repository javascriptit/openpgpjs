// GPG4Browsers - An OpenPGP implementation in javascript
// Copyright (C) 2011 Recurity Labs GmbH
// 
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.
// 
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
// 
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

/**
 * @class
 * @classdesc A generic message containing one or more literal packets.
 */

function openpgp_message() {
  this.packets = new openpgp_packetlist();


  function generic_decrypt(packets, passphrase) {
    var sessionkey;

    for (var i = 0; i < packets.length; i++) {
      if (packets[i].tag == openpgp_packet.tags.public_key_encrypted_session_key) {
        var key = openpgp.keyring.getKeyById(packets[i].public_key_id);

      }
    }

  }

  /**
   * Decrypts a message and generates user interface message out of the found.
   * MDC will be verified as well as message signatures
   * @param {openpgp_msg_privatekey} private_key the private the message is encrypted with (corresponding to the session key)
   * @param {openpgp_packet_encryptedsessionkey} sessionkey the session key to be used to decrypt the message
   * @return {} plaintext of the message or null on error
   */
  this.decrypt = function(key) {
    return this.decryptAndVerifySignature(private_key, sessionkey)
  }

  /**
   * Decrypts a message and generates user interface message out of the found.
   * MDC will be verified as well as message signatures
   * @param {openpgp_msg_privatekey} private_key the private the message is encrypted with (corresponding to the session key)
   * @param {openpgp_packet_encryptedsessionkey} sessionkey the session key to be used to decrypt the message
   * @param {openpgp_msg_publickey} pubkey Array of public keys to check signature against. If not provided, checks local keystore.
   * @return {String} plaintext of the message or null on error
   */
  function decryptAndVerifySignature(private_key, sessionkey, pubkey) {
    if (private_key == null || sessionkey == null || sessionkey == "")
      return null;
    var decrypted = sessionkey.decrypt(this, private_key.keymaterial);
    if (decrypted == null)
      return null;
    var packet;
    var position = 0;
    var len = decrypted.length;
    var validSignatures = new Array();
    util.print_debug_hexstr_dump("openpgp.msg.messge decrypt:\n", decrypted);

    var messages = openpgp.read_messages_dearmored({
      text: decrypted,
      openpgp: decrypted
    });
    for (var m in messages) {
      if (messages[m].data) {
        this.text = messages[m].data;
      }
      if (messages[m].signature) {
        validSignatures.push(messages[m].verifySignature(pubkey));
      }
    }
    return {
      text: this.text,
      validSignatures: validSignatures
    };
  }

  /**
   * Verifies a message signature. This function can be called after read_message if the message was signed only.
   * @param {openpgp_msg_publickey} pubkey Array of public keys to check signature against. If not provided, checks local keystore.
   * @return {boolean} true if the signature was correct; otherwise false
   */
  function verifySignature(pubkey) {
    var result = false;
    if (this.signature.tagType == 2) {
      if (!pubkey || pubkey.length == 0) {
        var pubkey;
        if (this.signature.version == 4) {
          pubkey = openpgp.keyring.getPublicKeysForKeyId(this.signature.issuerKeyId);
        } else if (this.signature.version == 3) {
          pubkey = openpgp.keyring.getPublicKeysForKeyId(this.signature.keyId);
        } else {
          util.print_error("unknown signature type on message!");
          return false;
        }
      }
      if (pubkey.length == 0)
        util.print_warning("Unable to verify signature of issuer: " + util.hexstrdump(this.signature.issuerKeyId) +
          ". Public key not found in keyring.");
      else {
        for (var i = 0; i < pubkey.length; i++) {
          var tohash = this.text.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
          if (this.signature.verify(tohash, pubkey[i])) {
            util.print_info("Found Good Signature from " + pubkey[i].obj.userIds[0].text + " (0x" + util.hexstrdump(
              pubkey[i].obj.getKeyId()).substring(8) + ")");
            result = true;
          } else {
            util.print_error("Signature verification failed: Bad Signature from " + pubkey[i].obj.userIds[0].text +
              " (0x" + util.hexstrdump(pubkey[0].obj.getKeyId()).substring(8) + ")");
          }
        }
      }
    }
    return result;
  }
}
