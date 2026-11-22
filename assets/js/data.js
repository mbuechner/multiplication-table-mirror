// Zeilen und Spalten entsprechen der Anordnung auf dem Schulwandbild.
const einmaleinsTafel = [
  [8, 16, 6, 27, 45, 63, 8, 36, 16],
  [18, 2, 10, 72, 9, 54, 24, 4, 32],
  [4, 12, 14, 36, 81, 18, 28, 20, 12],
  [42, 36, 12, 2, 9, 4, 32, 72, 16],
  [30, 6, 54, 6, 1, 8, 64, 8, 48],
  [18, 48, 24, 7, 5, 3, 24, 40, 56],
  [14, 42, 49, 35, 25, 15, 9, 24, 12],
  [63, 7, 35, 30, 5, 40, 15, 3, 27],
  [28, 56, 21, 10, 45, 20, 21, 18, 6],
];

const einmaleinsDaten = {
  tafel: einmaleinsTafel,
  // Die Variante platziert jedes Vielfache an der Position seines Faktors im Mittelquadrat.
  tafelNachMittelquadrat: einmaleinsTafel.map((zeile, zeilenIndex) => {
    const zeileImBlock = zeilenIndex % 3;
    const zeileImMittelquadrat = einmaleinsTafel[3 + zeileImBlock];
    const blockMittelzeile = einmaleinsTafel[zeilenIndex - zeileImBlock + 1];

    return zeile.map((_, spaltenIndex) => {
      const spalteImBlock = spaltenIndex % 3;
      const faktor = blockMittelzeile[spaltenIndex - spalteImBlock + 1];
      return faktor * zeileImMittelquadrat[3 + spalteImBlock];
    });
  }),
  randzahlen: {
    oben: 90,
    links: [20, 60, 70],
    rechts: [40, 80, 30],
    unten: 50,
  },
  teilenMitRest: [
    [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43],
    [47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97],
  ],
  dunkleTeilungszahlen: [23, 29, 31, 59, 61, 79, 83],
  einheiten: [
    ["DM", "Deutsche Mark"],
    ["Pf", "Pfennig"],
    ["km", "Kilometer"],
    ["m", "Meter"],
    ["cm", "Zentimeter"],
    ["kg", "Kilogramm"],
    ["g", "Gramm"],
    ["hl", "Hektoliter"],
    ["l", "Liter"],
    ["Tg", "Tag"],
    ["Std", "Stunde"],
  ],
};
