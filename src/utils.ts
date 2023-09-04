/**
 * Returns a YYYY-MM-DD representation of a Date object
 * @param date The date object to convert to a string
 * @returns A string containing the date object in the YYYY-MM-DD format
 */
export function getDateYearMonthDay(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Returns a MM/DD/YYYY representation of a Date object
 * @param date The date object to convert to a string
 * @returns A string containing the date object in the MM/DD/YYYY format
 */
export function getDateMonthDayYear(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}
