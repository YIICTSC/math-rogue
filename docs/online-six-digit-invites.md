# Six-digit invitations

New RPG / GP / golf / VR rooms display six numeric digits, without transport
prefixes. Host-generated codes occupy 000000–499999; dedicated servers generate
500000–999999 with cryptographic randomInt and retry duplicate active codes.
Codes remain strings so leading zeros survive display, copying, URL generation
and parsing. The numeric namespace lets typed codes route to the correct service
without asking participants to choose host/server communication.

Legacy six-character codes and H-/S- URLs still parse. Craft island networking is
outside this four-game change and retains its previous code generator.

All lobby codes use large, bold tabular numerals. Entry fields request a numeric
mobile keyboard while still allowing legacy code paste. RPG title has a direct
Join invitation action, which skips lesson selection, enters the join tab and
uses the same prepare/admit flow as URL invitations to receive the host setup.

Tests extend test-online-transport.mjs (leading zeros, namespace boundaries,
1,000 generated host codes, legacy URLs), test-online-invite-browser.mjs (numeric
server invitations and RPG title entry). Existing VR 40-socket and golf dedicated
server suites validate new room creation/joining. Local build includes typecheck
and English UI gates. New server-generated numeric codes require this matching
server code when deployed; no Render deployment is performed as part of local work.
