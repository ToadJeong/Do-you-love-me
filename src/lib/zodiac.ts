/** 별자리 (western zodiac) from an ISO birth date. */
export function getZodiac(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const [, m, d] = birthDate.split("-").map(Number);
  if (!m || !d) return null;
  const md = m * 100 + d;
  if (md >= 321 && md <= 419) return "양자리";
  if (md >= 420 && md <= 520) return "황소자리";
  if (md >= 521 && md <= 621) return "쌍둥이자리";
  if (md >= 622 && md <= 722) return "게자리";
  if (md >= 723 && md <= 822) return "사자자리";
  if (md >= 823 && md <= 923) return "처녀자리";
  if (md >= 924 && md <= 1022) return "천칭자리";
  if (md >= 1023 && md <= 1122) return "전갈자리";
  if (md >= 1123 && md <= 1224) return "사수자리";
  if (md >= 1225 || md <= 119) return "염소자리";
  if (md >= 120 && md <= 218) return "물병자리";
  return "물고기자리";
}
