/**
 * Correspondance, ligne par ligne, entre les arrêts du SAEIV Geo3D (identifiants Hanover) et les quais du GTFS
 * NOMAD classique, établie à partir des schémas de desserte des deux GTFS (30/09/2026).
 *
 * Un arrêt Geo3D correspond à l'ensemble des quais classiques qui le représentent sur la ligne (quais A/B selon
 * le sens ou la variante, voire arrêt voisin sur certaines variantes) : une course classique n'en dessert qu'un,
 * ce qui suffit à retrouver le bon quai une fois la course appariée.
 *
 * Un arrêt Geo3D absent de cette table est ignoré ; un nouvel arrêt côté SAEIV doit donc y être ajouté à la main.
 */
export const STOP_MAPPING = new Map<string, Map<string, string[]>>([
	[
		"216",
		new Map([
			// ROUEN - Gare Routière → ROUEN - Gare Routière [A/B]
			["226", ["FR:76540:ZE:1174227:ATOUMOD040", "FR:76540:ZE:1172579:ATOUMOD040"]],
			// MONT-SAINT-AIGNAN - La Pléiade → MONT-SAINT-AIGNAN - Campus (Maison de l'Université) [A]
			["253", ["FR:76451:ZE:1177764:ATOUMOD040"]],
			// LOUVIERS - Porte de l'Eau → LOUVIERS - Porte de l'Eau [A/B]
			["255", ["FR:27375:ZE:1118781:ATOUMOD040", "FR:27375:ZE:1178259:ATOUMOD040"]],
			// ÉVREUX - Gare SNCF → ÉVREUX - Gare Routière [A]
			["256", ["FR:27229:ZE:1117503:ATOUMOD040"]],
		]),
	],
	[
		"228",
		new Map([
			// PONT-AUDEMER - Gare Routière → PONT-AUDEMER - Gare Routière [A]
			["207", ["FR:27467:ZE:1119579:ATOUMOD040"]],
			// CORNEVILLE-SUR-RISLE - Robert Planquette → CORNEVILLE-SUR-RISLE - Robert Planquette [A/B] / CORNEVILLE-SUR-RISLE - RD675 [A]
			["209", ["FR:27174:ZE:1117055:ATOUMOD040", "FR:27174:ZE:1180576:ATOUMOD040", "FR:27174:ZE:1157216:ATOUMOD040"]],
			// CAUVERVILLE-EN-ROUMOIS - RD675 → CAUVERVILLE-EN-ROUMOIS - RD675 [A/B]
			["210", ["FR:27134:ZE:1116693:ATOUMOD040", "FR:27134:ZE:1180577:ATOUMOD040"]],
			// ROUGEMONTIERS - Chapelle → ÉTURQUERAYE - La Chapelle Brestot [A/B]
			["211", ["FR:27228:ZE:1123905:ATOUMOD040", "FR:27228:ZE:1180578:ATOUMOD040"]],
			// ROUTOT - Place de la Mairie → ROUTOT - Place de la mairie [A/B]
			["213", ["FR:27500:ZE:1122423:ATOUMOD040", "FR:27500:ZE:1180582:ATOUMOD040"]],
			// BOUQUETOT - Village → BOUQUETOT - Place [A/B]
			["214", ["FR:27102:ZE:1116359:ATOUMOD040", "FR:27102:ZE:1180553:ATOUMOD040"]],
			// BOURG-ACHARD - Champ de Foire → BOURG-ACHARD - Pompiers [A/B]
			["215", ["FR:27103:ZE:1122427:ATOUMOD040", "FR:27103:ZE:1178159:ATOUMOD040"]],
			// BOSGOUET - RD675 → BOSGOUET - RD675 [A/B]
			["216", ["FR:27091:ZE:1122841:ATOUMOD040", "FR:27091:ZE:1178125:ATOUMOD040"]],
			// LA TRINITÉ-DE-THOUBERVILLE - RD675 → LA TRINITÉ-DE-THOUBERVILLE - RD675 [A/B]
			["217", ["FR:27661:ZE:1120937:ATOUMOD040", "FR:27661:ZE:1178181:ATOUMOD040"]],
			// SAINT-OUEN-DE-THOUBERVILLE - Mairie → SAINT-OUEN-DE-THOUBERVILLE - Mairie [A] / SAINT-OUEN-DE-THOUBERVILLE - Pharmacie [A]
			["218", ["FR:27580:ZE:1155501:ATOUMOD040", "FR:27580:ZE:1122753:ATOUMOD040"]],
			// SAINT-OUEN-DE-THOUBERVILLE - La Chouque → SAINT-OUEN-DE-THOUBERVILLE - La Chouque [A] / CAUMONT - La Chouque [B]
			["219", ["FR:27580:ZE:1120381:ATOUMOD040", "FR:27133:ZE:1178208:ATOUMOD040"]],
			// LA LONDE - Maison Brûlée → LA BOUILLE - Maison Brulée (RD 675) [A]
			["220", ["FR:76131:ZE:1157214:ATOUMOD040"]],
			// GRAND-COURONNE - Lycée Fernand Léger → GRAND-COURONNE - Lycée Professionnel Fernand Léger [A/B]
			["221", ["FR:76319:ZE:1121737:ATOUMOD040", "FR:76319:ZE:1180614:ATOUMOD040"]],
			// GRAND-QUEVILLY - Zénith - Parc Expo → PETIT-COURONNE - Parc Expo [A/B]
			["222", ["FR:76497:ZE:1171827:ATOUMOD040", "FR:76497:ZE:1157212:ATOUMOD040"]],
			// ROUEN - Place Saint-Sever → ROUEN - Saint-Sever [A/B]
			["225", ["FR:76540:ZE:1123425:ATOUMOD040", "FR:76540:ZE:1178529:ATOUMOD040"]],
			// ROUEN - Gare Routière → ROUEN - Gare Routière [A/B]
			["226", ["FR:76540:ZE:1174227:ATOUMOD040", "FR:76540:ZE:1172579:ATOUMOD040"]],
			// ROUGEMONTIERS - Le Tremblay → ROUGEMONTIERS - Le Tremblay [A]
			["16934", ["FR:27497:ZE:1119783:ATOUMOD040"]],
			// PETIT-QUEVILLY - Stade Robert Diochon → LE PETIT-QUEVILLY - Stade Robert Diochon [A] / SOTTEVILLE-LES-ROUEN - Stade Robert Diochon [B]
			["22524", ["FR:76498:ZE:1157210:ATOUMOD040", "FR:76681:ZE:1180411:ATOUMOD040"]],
			// PONT-AUDEMER - Pompiers → PONT-AUDEMER - Pompiers [A/B]
			["63927", ["FR:27467:ZE:1123003:ATOUMOD040", "FR:27467:ZE:1180789:ATOUMOD040"]],
		]),
	],
	[
		"407",
		new Map([
			// ARGENTAN - Gare SNCF → ARGENTAN - Gare SNCF [A]
			["461", ["FR:61006:ZE:1165314:ATOUMOD040"]],
			// BAGNOLES DE L'ORNE - Office du Tourisme → BAGNOLES DE L'ORNE NORMANDIE - Office du Tourisme [A]
			["689", ["FR:61483:ZE:1165996:ATOUMOD040"]],
			// 2578 = Ancienne Gare (libellé inversé avec 2589 dans le référentiel Geo3D, cf. ordre et horaires de passage)
			// → LA FERTÉ MACÉ - Ancienne Gare SNCF [A]
			["2578", ["FR:61168:ZE:1165544:ATOUMOD040"]],
			// BAGNOLES DE L'ORNE - Église Sainte-Marie-Madeleine → BAGNOLES DE L'ORNE NORMANDIE - Église Sainte-Madeleine [A]
			["2586", ["FR:61483:ZE:1166004:ATOUMOD040"]],
			// 2589 = Place Neustadt (libellé inversé avec 2578 dans le référentiel Geo3D)
			// → LA FERTÉ MACÉ - Place Neustadt [A]
			["2589", ["FR:61168:ZE:1165546:ATOUMOD040"]],
		]),
	],
	[
		"423",
		new Map([
			// BRIOUZE - Gare SNCF → BRIOUZE - Gare SNCF [A]
			["99", ["FR:61063:ZE:1165098:ATOUMOD040"]],
			// BAGNOLES DE L'ORNE - Office du Tourisme → BAGNOLES DE L'ORNE NORMANDIE - Office du Tourisme [A]
			["689", ["FR:61483:ZE:1165996:ATOUMOD040"]],
			// 2578 = Ancienne Gare (libellé inversé avec 2589 dans le référentiel Geo3D, cf. ordre et horaires de passage)
			// → LA FERTÉ MACÉ - Ancienne Gare SNCF [A]
			["2578", ["FR:61168:ZE:1165544:ATOUMOD040"]],
			// BAGNOLES DE L'ORNE - Église Sainte-Marie-Madeleine → BAGNOLES DE L'ORNE NORMANDIE - Église Sainte-Madeleine [A]
			["2586", ["FR:61483:ZE:1166004:ATOUMOD040"]],
			// LONLAY-LE-TESSON - Parking → LONLAY-LE-TESSON - Parking [A]
			["2588", ["FR:61233:ZE:1164610:ATOUMOD040"]],
			// 2589 = Place Neustadt (libellé inversé avec 2578 dans le référentiel Geo3D)
			// → LA FERTÉ MACÉ - Place Neustadt [A]
			["2589", ["FR:61168:ZE:1165546:ATOUMOD040"]],
		]),
	],
	[
		"424",
		new Map([
			// BRIOUZE - Gare SNCF → BRIOUZE - Gare SNCF [A]
			["99", ["FR:61063:ZE:1165098:ATOUMOD040"]],
			// ARGENTAN - Gare SNCF → ARGENTAN - Gare SNCF [A]
			["461", ["FR:61006:ZE:1165314:ATOUMOD040"]],
			// ÉCOUCHE-LES-VALLÉES - Gare SNCF → ÉCOUCHÉ-LES-VALLÉES - Gare SNCF [A]
			["2500", ["FR:61153:ZE:1165476:ATOUMOD040"]],
			// BELLOU-EN-HOULME - Église → BELLOU-EN-HOULME - Église [A]
			["2567", ["FR:61040:ZE:1168748:ATOUMOD040"]],
			// MESSEI - Rue Riegler → MESSEI - Rue Riegler [A]
			["2568", ["FR:61278:ZE:1163416:ATOUMOD040"]],
			// FLERS - Gare SNCF → FLERS - Gare SNCF [A]
			["3684", ["FR:61169:ZE:1165554:ATOUMOD040"]],
			// 2566 PUTANGES-LE-LAC - Fromentel : non desservi par la 424 dans le GTFS classique.
		]),
	],
	[
		"527",
		new Map([
			// GISORS - Gare SNCF → GISORS - Gare SNCF [A]
			["227", ["FR:27284:ZE:1117987:ATOUMOD040"]],
			// ÉRAGNY-SUR-EPTE - Mairie → ÉRAGNY-SUR-EPTE - Mairie [A/B]
			["228", ["FR:60211:ZE:1157964:ATOUMOD040", "FR:60211:ZE:1175890:ATOUMOD040"]],
			// SERIFONTAINE - Droittecourt → SÉRIFONTAINE - Droittecourt [A/B]
			["229", ["FR:60616:ZE:1157962:ATOUMOD040", "FR:60616:ZE:1175891:ATOUMOD040"]],
			// SERIFONTAINE - Stade → SÉRIFONTAINE - Stade [A/B]
			["230", ["FR:60616:ZE:1157956:ATOUMOD040", "FR:60616:ZE:1175894:ATOUMOD040"]],
			// TALMONTIERS - Mairie → TALMONTIERS - Mairie [A/B]
			["231", ["FR:60626:ZE:1106826:ATOUMOD040", "FR:60626:ZE:1175854:ATOUMOD040"]],
			// BOUCHEVILLIERS - Centre → BOUCHEVILLIERS - Centre [A/B]
			["232", ["FR:27098:ZE:1101446:ATOUMOD040", "FR:27098:ZE:1174829:ATOUMOD040"]],
			// NEUF-MARCHÉ - La Poste → NEUF-MARCHÉ - La Poste [A/B]
			["233", ["FR:76463:ZE:1107964:ATOUMOD040", "FR:76463:ZE:1171389:ATOUMOD040"]],
			// GOURNAY-EN-BRAY - Saint-Crespin → GOURNAY-EN-BRAY - Saint-Crespin [A/B]
			["234", ["FR:76312:ZE:1104638:ATOUMOD040", "FR:76312:ZE:1171700:ATOUMOD040"]],
			// FERRIÈRES-EN-BRAY - Place de la Gare → FERRIERES-EN-BRAY - Place de la Gare [A/B]
			["235", ["FR:76260:ZE:1105362:ATOUMOD040", "FR:76260:ZE:1170785:ATOUMOD040"]],
			// FORGES-LES-EAUX - Place Brévière → FORGES-LES-EAUX - Place Bréviere [A]
			["236", ["FR:76276:ZE:1107864:ATOUMOD040"]],
			// SAINT-SAIRE - Ancienne Gare SNCF → NESLE-HODENG - Ancienne Gare SNCF [A/B]
			["240", ["FR:76459:ZE:1102224:ATOUMOD040", "FR:76459:ZE:1175849:ATOUMOD040"]],
			// NEUFCHÂTEL-EN-BRAY - Tête de Cheval → NEUFCHÂTEL-EN-BRAY - La Tete de Cheval (Boulevard l'Alouette) [A] / NEUFCHÂTEL-EN-BRAY - La Tete de Cheval (Route de Gaillefontaine) [B]
			["241", ["FR:76462:ZE:1108156:ATOUMOD040", "FR:76462:ZE:1171387:ATOUMOD040"]],
			// NEUFCHÂTEL-EN-BRAY - Place de la Libération → NEUFCHÂTEL-EN-BRAY - Place de la Libération [A]
			["242", ["FR:76462:ZE:1103542:ATOUMOD040"]],
			// MESNIÈRES-EN-BRAY - Mairie / École → MESNIERES-EN-BRAY - Mairie / École [A/B]
			["243", ["FR:76427:ZE:1104132:ATOUMOD040", "FR:76427:ZE:1171811:ATOUMOD040"]],
			// BURES-EN-BRAY - Carrefour → BURES-EN-BRAY - Carrefour [A/B]
			["244", ["FR:76148:ZE:1105850:ATOUMOD040", "FR:76148:ZE:1175850:ATOUMOD040"]],
			// OSMOY-SAINT-VALÉRY - École → OSMOY-SAINT-VALERY - École [A/B]
			["245", ["FR:76487:ZE:1103380:ATOUMOD040", "FR:76487:ZE:1175895:ATOUMOD040"]],
			// SAINT-VAAST-D'ÉQUIQUEVILLE - Transformateur → SAINT-VAAST-D'ÉQUIQUEVILLE - Transformateur [A/B]
			["246", ["FR:76652:ZE:1109404:ATOUMOD040", "FR:76652:ZE:1170781:ATOUMOD040"]],
			// FREULLEVILLE → FREULLEVILLE - Freulleville [A/B]
			["247", ["FR:76288:ZE:1171471:ATOUMOD040", "FR:76288:ZE:1157168:ATOUMOD040"]],
			// MEULERS - Centre → MEULERS - Centre [A/B]
			["248", ["FR:76437:ZE:1104084:ATOUMOD040", "FR:76437:ZE:1171130:ATOUMOD040"]],
			// DAMPIERRE-SAINT-NICOLAS - Centre → DAMPIERRE-SAINT-NICOLAS - Centre [A/B]
			["249", ["FR:76210:ZE:1105170:ATOUMOD040", "FR:76210:ZE:1170487:ATOUMOD040"]],
			// SAINT-AUBIN-LE-CAUF - Mairie → SAINT-AUBIN-LE-CAUF - Mairie [A/B]
			["250", ["FR:76562:ZE:1102618:ATOUMOD040", "FR:76562:ZE:1170571:ATOUMOD040"]],
			// ARQUES-LA-BATAILLE - Gare → ARQUES-LA-BATAILLE - Gare [A/B]
			["251", ["FR:76026:ZE:1107000:ATOUMOD040", "FR:76026:ZE:1169585:ATOUMOD040"]],
			// DIEPPE - Gare Routière → DIEPPE - Gare Routière [A]
			["252", ["FR:76217:ZE:1106044:ATOUMOD040"]],
			// GOURNAY-EN-BRAY - Félix Faure → GOURNAY-EN-BRAY - Félix Faure [A/B]
			["352", ["FR:76312:ZE:1157952:ATOUMOD040", "FR:76312:ZE:1175129:ATOUMOD040"]],
			// SERIFONTAINE - Parc Jacques Duclos → SÉRIFONTAINE - Parc Jacques Duclos [A/B]
			["353", ["FR:60616:ZE:1157958:ATOUMOD040", "FR:60616:ZE:1175893:ATOUMOD040"]],
			// SERIFONTAINE - La Vigne → SÉRIFONTAINE - La Vigne [A/B]
			["354", ["FR:60616:ZE:1157960:ATOUMOD040", "FR:60616:ZE:1175892:ATOUMOD040"]],
			// TALMONTIERS - Val d'un Œuf → TALMONTIERS - Val d'un Oeuf [A/B]
			["355", ["FR:60626:ZE:1115200:ATOUMOD040", "FR:60626:ZE:1175853:ATOUMOD040"]],
			// SERQUEUX - Gare SNCF → SERQUEUX - Gare [A/B/C]
			["999", ["FR:76672:ZE:1101874:ATOUMOD040", "FR:76672:ZE:1170845:ATOUMOD040", "FR:76672:ZE:1178424:ATOUMOD040"]],
		]),
	],
]);
