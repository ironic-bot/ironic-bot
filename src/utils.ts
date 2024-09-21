export function calculateXpNeededForLevel(level: number): number {
	return 5 * Math.pow(level, 2) + 50 * level + 100;
}

export function getRandomNumberBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function calculatePercentageChange(initialValue: number, changeValue: number) {
	const percentageChange = ((changeValue - initialValue) / Math.abs(initialValue)) * 100;

	if (percentageChange > 0) {
		return '+' + percentageChange.toFixed(2) + '%'; // Positive change
	} else if (percentageChange < 0) {
		return percentageChange.toFixed(2) + '%'; // Negative change
	} else {
		return '0%'; // No change
	}
}
