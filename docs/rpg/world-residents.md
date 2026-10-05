# World residents and nearby conversations

Standard and custom residents now have saved, deterministic tile positions in the world. Residents wander near their town or shared home, rest, and look around; routes avoid blocked terrain, buildings, other walkers, and players. NPC event characters with matching portraits share one world actor with the corresponding resident. Remaining NPC event characters also wander.

Approach within two tiles to use the map portrait button or E. Resident actions use a dedicated full-screen conversation with talk, gifts, outings, word teaching, cohabitation, and marriage. NPC job/event conversations also occupy the full screen. Direct social actions validate proximity on the authoritative game model. Existing courier gifts remain available through their original delivery systems.

Residents stop near players and during conversation. Conversation leases prevent movement and incompatible map actions, expire after inactivity, and are cleared on close or save restoration. Saves retain wandering positions; old saves initialize missing positions safely. Both 2D and 3D views display the same actors and positions.

Validation: `pnpm run build`, `pnpm run server:build`, resident world/browser checks, existing town model/browser, city, lifestyle, and real 3D browser checks. Resident browser coverage includes five phone/desktop viewports, all action tabs, word teaching, actual conversation, movement ownership, and full-screen NPC events.
