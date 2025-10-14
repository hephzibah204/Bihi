import { SchoolSettings } from '../types';

/**
 * Generates a flat list of full class names from the schoolStructure object.
 * e.g., ["Nursery 1A", "Nursery 1B", "JSS 1A", "JSS 1B"]
 * @param settings - The school's settings object containing the schoolStructure.
 * @returns An array of strings representing all possible class names.
 */
export const generateClassNames = (settings: SchoolSettings | null): string[] => {
    if (!settings?.schoolStructure?.levels) {
        // Fallback for old structure or empty settings
        return ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];
    }

    const { levels, sections } = settings.schoolStructure;
    const classNames: string[] = [];

    levels.forEach(level => {
        level.classes.forEach(cls => {
            if (sections && sections.length > 0) {
                sections.forEach(section => {
                    classNames.push(`${level.name} ${cls.name}${section.name}`);
                });
            } else {
                classNames.push(`${level.name} ${cls.name}`);
            }
        });
    });

    return classNames;
};