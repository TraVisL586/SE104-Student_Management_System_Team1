export function getCurrentSemesterInfo(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  let semesterStart;
  let academicYear;
  let semesterName;
  let maxWeeks = 20; // 20 weeks per main semester

  if (month >= 7 && month <= 11) {
    // Aug - Dec: Semester 1 (Starting roughly mid-August)
    // First Monday of Aug 2025: Aug 4, 11
    semesterStart = new Date(year, 7, 11);
    academicYear = `${year} / ${year + 1}`;
    semesterName = "Học kỳ 1";
  } else if (month >= 0 && month <= 5) {
    // Jan - Jun: Semester 2 (Starting late January)
    // Monday of Jan 2026: Jan 26
    semesterStart = new Date(year, 0, 26);
    academicYear = `${year - 1} / ${year}`;
    semesterName = "Học kỳ 2";
  } else {
    // Jul: Summer Semester
    // Monday of Jun 2026: Jun 29
    semesterStart = new Date(year, 5, 29);
    academicYear = `${year - 1} / ${year}`;
    semesterName = "Học kỳ Hè";
    maxWeeks = 8;
  }

  // Calculate elapsed days safely. We use setHours(0,0,0,0) to ignore time differences.
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  const start = new Date(semesterStart);
  start.setHours(0, 0, 0, 0);

  const timeDiff = today.getTime() - start.getTime();
  const daysElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  let week = Math.floor(daysElapsed / 7) + 1;
  
  // Clamp week between 1 and maxWeeks
  week = Math.max(1, Math.min(week, maxWeeks));

  return {
    academicYear,
    semesterName,
    week,
    maxWeeks,
    semesterStart
  };
}
