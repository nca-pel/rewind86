/**
 * Alltag im Haus: Was Jan sieht und hört, wenn er die Zimmertür öffnet, die zufälligen Fragen seiner Mutter und
 * Omas Anrufe. Reine Atmosphäre – nichts davon beeinflusst Verdacht, Vertrauen, Rätsel oder Enden.
 */

const MO_FR = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const MO_SA = [...MO_FR, 'Samstag'];

export interface DoorScene {
  /** Wochentage (fehlt = alle) */
  days?: string[];
  /** Nur an diesem Datum (JJJJ-MM-TT) */
  date?: string;
  /** Nur an Schultagen / nur an schulfreien Tagen */
  schoolDay?: boolean;
  /** Uhrzeit von (einschließlich) bis (ausschließlich), HH:MM; über Mitternacht erlaubt */
  from: string;
  to: string;
  /** Mehrere Varianten; eine wird zufällig gewählt */
  texts: string[];
}

/** Erster passender Eintrag gewinnt – Besonderes (Datum, Sonntag) steht vor dem Allgemeinen. */
export const DOOR_SCENES: DoorScene[] = [
  // Buß- und Bettag (schulfrei)
  {
    date: '1986-11-19',
    from: '08:00',
    to: '13:00',
    texts: [
      'Du öffnest die Tür. Im Flur liegt der Duft von Zimt und Butter; in der Küche backt deine Mutter. Aus dem Wohnzimmer dringt eine Radioandacht, feierlich und gedämpft: Buß- und Bettag, keine Schule, keine Musik. Dein Vater sitzt im Sessel, die Zeitung auf den Knien, und sieht so aus, als würde er schon den ganzen Vormittag büßen.',
      'Der Flur ist ungewohnt still. Heute ist Buß- und Bettag; im Radio spricht ein Pfarrer mit sanfter Stimme über Umkehr, und aus der Küche kommt das Klappern des Rührbesens. Die Haustür ist abgeschlossen, die Straße draußen leer. Du machst die Tür wieder zu.',
    ],
  },
  // Nacht
  {
    from: '23:00',
    to: '05:30',
    texts: [
      'Du öffnest die Tür einen Spalt. Im Flur ist es dunkel, nur die Standuhr tickt. Aus dem Schlafzimmer deiner Eltern hörst du ein gleichmäßiges Schnarchen. Du ziehst die Tür leise wieder zu.',
      'Dunkler Flur, kalter Boden. Das Treppenlicht ist aus, und irgendwo unten knackt die Heizung. Nichts regt sich. Leise machst du die Tür wieder zu.',
      'Kein Licht im Flur, nur der blasse Streifen der Straßenlaterne am Treppenfenster. Es riecht nach kaltem Kaffee und Hausschuhen. Du schließt die Tür, so leise es geht.',
    ],
  },
  // frühmorgens an Schultagen
  {
    days: MO_SA,
    schoolDay: true,
    from: '05:30',
    to: '09:00',
    texts: [
      'Du öffnest die Tür. Unten läuft die Kaffeemaschine, im Radio sagen sie den Verkehr an, und deine Mutter schmiert Pausenbrote. Dein Vater raschelt mit der Zeitung am Frühstückstisch. Der ganz normale Wahnsinn vor der Schule.',
      'Im Flur riecht es nach Kaffee und Toast. Aus der Küche tönt das Morgenmagazin, deine Mutter ruft nach der Butter, dein Vater sucht seine Brille. Du machst die Tür lieber wieder zu.',
    ],
  },
  // Sonntag
  {
    days: ['Sonntag'],
    from: '09:00',
    to: '12:00',
    texts: [
      'Du öffnest die Tür. Durchs Treppenhaus dringen Kirchenglocken, und aus der Küche riecht es nach Braten mit Zwiebeln. Deine Mutter summt, dein Vater liest die Sonntagszeitung und knurrt über die Nachrichten. Der Sonntag riecht nach Familie.',
      'Im Flur duftet es schon nach Sonntagsbraten. Aus dem Radio kommt getragene Musik, im Wohnzimmer wird der Tisch gedeckt, das gute Geschirr klappert. Du machst die Tür wieder zu.',
    ],
  },
  {
    days: ['Sonntag'],
    from: '12:00',
    to: '15:00',
    texts: [
      'Du öffnest die Tür. Aus dem Esszimmer hörst du Besteck und das gedämpfte Gespräch deiner Eltern. Der Braten ist längst aufgetragen, im Radio läuft leise ein Wunschkonzert. Gleich wird abgeräumt.',
      'Sonntagnachmittag im Flur: Es riecht nach Soße und Kaffee, die Wohnzimmertür steht halb offen, dein Vater hat sich mit der Zeitung aufs Sofa verzogen und atmet schon verdächtig gleichmäßig.',
    ],
  },
  {
    days: ['Sonntag'],
    from: '15:00',
    to: '18:30',
    texts: [
      'Der Sonntagnachmittag zieht sich durch das Haus wie Kaugummi. Im Flur riecht es nach Kaffee und Kuchen, aus dem Wohnzimmer kommt gedämpft ein Heimatfilm. Niemand will etwas von dir. Das ist das Beste am Sonntag.',
      'Du öffnest die Tür. Deine Mutter sitzt im Wohnzimmer über einer Handarbeit, der Fernseher läuft ohne Ton. Dein Vater schläft im Sessel, die Brille auf der Stirn. Du schleichst nicht, du machst nur schnell wieder zu.',
    ],
  },
  {
    days: ['Sonntag'],
    from: '18:30',
    to: '23:00',
    texts: [
      'Im Flur hörst du den Fernseher: Gleich beginnt der Sonntagabendkrimi. Deine Mutter räumt in der Küche das Abendbrot weg, dein Vater schaltet den Ton lauter. Das Haus macht sich bereit für die neue Woche.',
      'Du öffnest die Tür. Aus dem Wohnzimmer dröhnt die Titelmusik des Krimis, deine Mutter bügelt im Flurlicht, und die Schultasche für morgen steht schon an der Treppe. Sonntagabend eben.',
    ],
  },
  // Samstag
  {
    days: ['Samstag'],
    from: '12:00',
    to: '15:30',
    texts: [
      'Samstagmittag im Haus. Es riecht nach Putzmittel und Eintopf. Dein Vater wienert unten im Hof das Auto, deine Mutter wischt den Flur. Du balancierst über die nassen Stellen zurück in dein Zimmer.',
      'Du öffnest die Tür. Aus der Küche klappern Töpfe, im Radio läuft Wochenendmusik. Alles ist ein bisschen lauter als unter der Woche, ein bisschen fröhlicher. Das ist Samstag.',
    ],
  },
  {
    days: ['Samstag'],
    from: '15:30',
    to: '18:50',
    texts: [
      'Im Wohnzimmer läuft die Bundesliga-Konferenz im Radio, ein Reporter schreit sich in den Torjubel. Dein Vater hört mit gerunzelter Stirn zu, als würde er den Spielstand durch Willenskraft ändern. Aus der Küche duftet es nach Kaffee.',
      'Du öffnest die Tür. Aus dem Flur schallt »Tor in Dortmund!«, und dein Vater brummt »Das gibt’s doch nicht«. Deine Mutter backt Waffeln für den Nachmittag. Du schließt die Tür wieder.',
    ],
  },
  {
    days: ['Samstag'],
    from: '19:30',
    to: '23:00',
    texts: [
      'Aus dem Wohnzimmer dröhnt die Samstagabendshow, Applaus und Trompetenfanfaren. Deine Eltern sitzen eng nebeneinander auf dem Sofa, dein Vater mit einer Tüte Erdnüsse. Du schließt leise die Tür.',
      'Du öffnest die Tür. Im Flur flimmert das Licht des Fernsehers, die Samstagabendunterhaltung läuft, und dein Vater lacht an einer Stelle, an der du nichts Komisches gehört hast. Es ist gemütlich da unten.',
    ],
  },
  // Schultage nachmittags / abends
  {
    days: MO_FR,
    schoolDay: true,
    from: '13:30',
    to: '17:00',
    texts: [
      'Du öffnest die Tür. Unten läuft der Staubsauger, später das Nachmittagsprogramm im Radio. Deine Mutter hat das Mittagessen aufgewärmt, es riecht nach Gemüse und Soße. Die Hausaufgaben schweben wie eine Wolke durchs Treppenhaus.',
      'Im Flur ist es ruhig, nur aus der Küche kommt das Plätschern des Spülwassers: Deine Mutter spült von Hand. Dein Vater ist noch nicht da. Es riecht nach Spülmittel.',
    ],
  },
  {
    days: MO_FR,
    schoolDay: true,
    from: '17:00',
    to: '18:50',
    texts: [
      'Du öffnest die Tür. Die Haustür klappt, dein Vater kommt gerade nach Hause, die Aktentasche in der Hand. In der Küche brät etwas, deine Mutter fragt, wie sein Tag war. Gleich gibt es Abendbrot.',
      'Aus der Küche zischt die Pfanne, im Flur hängt der Geruch von Zwiebeln. Dein Vater zieht im Flur die Schuhe aus und ruft »Bin zu Hause!«. Du hörst, wie die Tür zum Wohnzimmer aufgeht.',
    ],
  },
  {
    from: '19:30',
    to: '20:15',
    texts: [
      'Du öffnest die Tür. Aus dem Wohnzimmer das Pausenzeichen der Nachrichten, dann die gewichtige Stimme: Es ist kurz vor acht. Dein Vater sitzt gerade, die Hände auf den Knien. Bis zum Ende der Nachrichten ist im Haus Ruhe.',
      'Im Flur wird es still: Gleich beginnt die Tagesschau. Dein Vater schaltet den Ton hoch, deine Mutter bringt Tee ins Wohnzimmer. Du schließt die Tür, um nicht zu stören.',
    ],
  },
  {
    from: '20:15',
    to: '23:00',
    texts: [
      'Aus dem Wohnzimmer kommt der Fernsehton, ein Spielfilm mit Schüssen und Musik. Deine Mutter strickt, dein Vater ist hinter der Zeitung eingenickt. Der Flur liegt im blauen Fernsehlicht.',
      'Du öffnest die Tür. Die Abendbeleuchtung im Flur ist gedimmt, aus dem Wohnzimmer kommt gedämpft der Abendfilm. Irgendwo tickt die Standuhr. Es riecht nach Tee.',
      'Unten lacht jemand im Fernsehen, deine Mutter lacht kurz mit. Dein Vater ruft: »Jan, mach nicht so lange!« Du machst die Tür zu.',
    ],
  },
  // Rest (Vormittag an freien Tagen, Randzeiten)
  {
    from: '00:00',
    to: '24:00',
    texts: [
      'Du öffnest die Tür und schaust in den Flur. Unten tickt die Standuhr, aus der Küche kommen vertraute Geräusche. Alles wie immer. Du machst die Tür wieder zu – dein Platz ist am Schreibtisch.',
    ],
  },
];

export interface MotherQuestion {
  ask: string;
  reply: string;
  /** Nur an Schultagen / nur nachmittags/abends usw. */
  schoolDay?: boolean;
  from?: string;
  to?: string;
}

/** Zufällig eingestreute Fragen der Mutter; Jan antwortet kurz (reine Stimmung, keine Auswirkung). */
export const MOTHER_QUESTIONS: MotherQuestion[] = [
  {
    ask: '(von unten) »Jan, hast du Hunger? Ich hab noch einen Rest Auflauf von gestern!«',
    reply: 'Du rufst zurück: »Später, danke!«',
    from: '09:00',
    to: '19:30',
  },
  {
    ask: '(von unten) »Hast du deine Hausaufgaben schon gemacht?«',
    reply: 'Du rufst: »Fast!« – was streng genommen nicht gelogen ist.',
    schoolDay: true,
    from: '13:30',
    to: '21:00',
  },
  {
    ask: '(von unten) »Jan, möchtest du eine Tasse Tee? Das Wasser kocht schon.«',
    reply: 'Du rufst: »Gerne, aber lass nur, ich hol mir gleich selbst!«',
    from: '14:00',
    to: '21:30',
  },
  {
    ask: '(von unten) »Lüfte mal dein Zimmer, bei dir riecht es nach heißer Elektronik!«',
    reply: 'Du brummst »Mach ich« und kippst das Fenster. Zwei Minuten lang.',
  },
  {
    ask: '(von unten) »Telefonier nicht so lange, ich warte auf einen Anruf von Tante Gisela!«',
    reply: 'Du rufst: »Mach ich nicht!« – mit der Hand auf dem Hörer.',
    from: '09:00',
    to: '21:00',
  },
  {
    ask: '(von unten) »Hast du mal wieder was von Ralf gehört? Das ist so ein netter Junge.«',
    reply: 'Du rufst: »Der trainiert viel.« Mehr fällt dir dazu nicht ein.',
  },
  {
    ask: '(von unten) »Kannst du nachher den Müll runterbringen?«',
    reply: 'Du rufst: »Mach ich!« und merkst dir nichts davon.',
    from: '14:00',
    to: '21:00',
  },
  {
    ask: '(von unten) »Frische Socken liegen auf deinem Bett! Und zieh dir was an, es soll regnen!«',
    reply: 'Du schaust aufs Bett: tatsächlich Socken. Du rufst »Danke!«.',
  },
  {
    ask: '(von unten) »Wie war es in der Schule?«',
    reply: 'Du rufst: »Wie immer!« Das genügt ihr meistens.',
    schoolDay: true,
    from: '13:30',
    to: '19:00',
  },
  {
    ask: '(von unten) »Magst du heute Abend Reibekuchen? Dann schäle ich schon die Kartoffeln.«',
    reply: 'Du rufst: »Au ja!« und merkst, dass du tatsächlich Hunger hast.',
    from: '14:00',
    to: '18:30',
  },
  {
    ask: '(von unten) »Kommst du am Wochenende mit zu Tante Gisela? Sie fragt schon nach dir.«',
    reply: 'Du rufst: »Mal sehen!« Das heißt bei dir meistens: nein.',
    from: '10:00',
    to: '21:00',
  },
  {
    ask: '(von unten) »Was machst du da oben eigentlich die ganze Zeit?«',
    reply: 'Du rufst: »Programmieren!« Es folgt ein langes, skeptisches Schweigen.',
    from: '10:00',
    to: '22:00',
  },
  {
    ask: '(von unten) »Brauchst du was aus dem Keller? Ich geh gerade runter!«',
    reply: 'Du rufst: »Nein, danke!« – und hoffst, dass sie nicht noch den Karton mit den Kabeln entdeckt.',
    from: '09:00',
    to: '21:00',
  },
  {
    ask: '(von unten) »Jan, hast du heute schon gegessen? Du siehst blass aus!«',
    reply: 'Du rufst: »Mir geht’s gut!« und isst heimlich einen Keks aus der Schublade.',
    from: '10:00',
    to: '21:00',
  },
];

/** Omas Anrufe: Eröffnung, Gesprächsthemen (Oma / Jan) und Abschied. */
export const OMA_OPENERS = [
  '»Jan? Bist du das? Hier ist Oma. Ich wollte nur mal hören, wie es dir geht.«',
  '»Jan, mein Junge! Hier ist Oma. Ich hab mir gedacht, ich ruf mal an. Alles in Ordnung bei euch?«',
  '»Ja, Jan? Hier ist deine Oma. Ich störe doch nicht? Dein Vater ruft ja nie an, da muss ich eben selbst ran.«',
];

export interface OmaTopic {
  oma: string;
  jan: string;
}

export const OMA_TOPICS: OmaTopic[] = [
  {
    oma: '»Und die Schule? Lernst du auch schön?«',
    jan: '»Ja, Oma, läuft ganz gut.« (Es läuft, wenn man Computer nicht mitzählt.)',
  },
  {
    oma: '»Isst du auch ordentlich? Deine Mutter sagt, du sitzt nur noch am Schreibtisch.«',
    jan: '»Ich esse genug, Oma. Bratkartoffeln, Reibekuchen, alles dabei.«',
  },
  {
    oma: '»Mein Bein zwickt wieder. Das gibt bestimmt Regen.«',
    jan: '»Gute Besserung, Oma. Und trag den Regenschirm mit.«',
  },
  {
    oma: '»Sitzt du immer noch den ganzen Tag vor dem Fernseher mit den Tasten? Davon bekommt man viereckige Augen.«',
    jan: '»Das ist ein Computer, Oma. Und meine Augen sind noch rund.«',
  },
  {
    oma: '»Die Nachbarskatze hat schon wieder meine Geranien ausgegraben. Das Biest!«',
    jan: '»Dann sperr sie in den Keller, Oma.« – »Das tut sie nie«, sagt Oma, »die ist viel zu klug.«',
  },
  {
    oma: '»Kommst du mal wieder vorbei? Ich hab Hefezopf gebacken, viel zu viel für mich allein.«',
    jan: '»Ich schau mal, Oma. Vielleicht am Wochenende.«',
  },
  {
    oma: '»Weißt du noch, wie ihr an Weihnachten bei mir wart? Da hast du die Tannennadeln gezählt.«',
    jan: '»Daran erinnere ich mich, Oma. Es waren 4721, glaube ich.«',
  },
  {
    oma: '»Dein Vater ruft ja nie an. Ist er wieder so beschäftigt?«',
    jan: '»Viel Arbeit, Oma. Ich sag ihm, er soll sich melden.«',
  },
  {
    oma: '»Im Radio haben sie wieder was von der Volkszählung erzählt. Ich sag dir, die kriegen mich nicht.«',
    jan: '»Da kommt wahrscheinlich nur ein Fragebogen, Oma.« – »Eben«, sagt sie, »genau das meine ich.«',
  },
];

export const OMA_CLOSERS = [
  '»Na, ich will nicht länger stören, das Telefon ist ja teuer. Grüß deine Eltern von mir, ja?«',
  '»Dann lass ich dich mal wieder. Mach’s gut, mein Junge, und pass auf dich auf!«',
  '»Ich muss auch los, mein Eintopf kocht über. Tschüss, Jan, und iss was Ordentliches!«',
];
