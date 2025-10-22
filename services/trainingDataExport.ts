// services/trainingDataExport.ts
// Pipeline for exporting high-quality cached responses as training data

import { getSemanticSearchEngine } from './semanticSearch';
import { scoreResponseQuality } from './semanticSearchUtils';

export interface TrainingExample {
    prompt: string;
    completion: string;
    metadata: {
        quality_score: number;
        confidence: number;
        category?: string;
        subject?: string;
        grade?: string;
        region?: string;
        timestamp: number;
    };
}

export interface ExportFormat {
    format: 'jsonl' | 'csv' | 'huggingface' | 'openai';
    minQualityScore?: number;
    minConfidence?: number;
    categories?: string[];
    maxExamples?: number;
}

export interface ExportStats {
    totalExamples: number;
    exportedExamples: number;
    filteredByQuality: number;
    filteredByConfidence: number;
    filteredByCategory: number;
    avgQualityScore: number;
    avgResponseLength: number;
    categoriesDistribution: Record<string, number>;
}

/**
 * Training Data Export Manager
 * Prepares cached responses for model fine-tuning
 */
export class TrainingDataExporter {
    private searchEngine = getSemanticSearchEngine();
    
    /**
     * Export training data in specified format
     */
    public export(options: ExportFormat = { format: 'jsonl' }): {
        data: string;
        stats: ExportStats;
    } {
        const examples = this.collectTrainingExamples(options);
        const stats = this.calculateStats(examples);
        
        let data: string;
        
        switch (options.format) {
            case 'jsonl':
                data = this.exportToJSONL(examples);
                break;
            case 'csv':
                data = this.exportToCSV(examples);
                break;
            case 'huggingface':
                data = this.exportToHuggingFace(examples);
                break;
            case 'openai':
                data = this.exportToOpenAI(examples);
                break;
            default:
                data = this.exportToJSONL(examples);
        }
        
        return { data, stats };
    }
    
    /**
     * Collect and filter training examples
     */
    private collectTrainingExamples(options: ExportFormat): TrainingExample[] {
        const exported = this.searchEngine.export();
        const examples: TrainingExample[] = [];
        
        for (const [id, doc] of exported.documents) {
            // Calculate quality score
            const qualityScore = scoreResponseQuality(doc.response);
            const confidence = doc.metadata?.confidence || 0.5;
            
            // Apply filters
            if (options.minQualityScore && qualityScore < options.minQualityScore) {
                continue;
            }
            
            if (options.minConfidence && confidence < options.minConfidence) {
                continue;
            }
            
            if (options.categories && options.categories.length > 0) {
                const category = doc.metadata?.category;
                if (!category || !options.categories.includes(category)) {
                    continue;
                }
            }
            
            examples.push({
                prompt: doc.prompt,
                completion: doc.response,
                metadata: {
                    quality_score: qualityScore,
                    confidence: confidence,
                    category: doc.metadata?.category,
                    subject: doc.metadata?.subject,
                    grade: doc.metadata?.grade,
                    region: doc.metadata?.region,
                    timestamp: doc.metadata?.timestamp || Date.now()
                }
            });
        }
        
        // Sort by quality score (highest first)
        examples.sort((a, b) => b.metadata.quality_score - a.metadata.quality_score);
        
        // Limit examples if specified
        if (options.maxExamples && examples.length > options.maxExamples) {
            return examples.slice(0, options.maxExamples);
        }
        
        return examples;
    }
    
    /**
     * Export to JSONL format (one JSON object per line)
     */
    private exportToJSONL(examples: TrainingExample[]): string {
        return examples.map(example => JSON.stringify({
            prompt: example.prompt,
            completion: example.completion,
            metadata: example.metadata
        })).join('\n');
    }
    
    /**
     * Export to CSV format
     */
    private exportToCSV(examples: TrainingExample[]): string {
        const headers = [
            'prompt',
            'completion',
            'quality_score',
            'confidence',
            'category',
            'subject',
            'grade',
            'region',
            'timestamp'
        ];
        
        const rows = examples.map(ex => [
            this.escapeCSV(ex.prompt),
            this.escapeCSV(ex.completion),
            ex.metadata.quality_score.toFixed(3),
            ex.metadata.confidence.toFixed(3),
            ex.metadata.category || '',
            ex.metadata.subject || '',
            ex.metadata.grade || '',
            ex.metadata.region || '',
            new Date(ex.metadata.timestamp).toISOString()
        ]);
        
        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }
    
    /**
     * Export for Hugging Face fine-tuning
     */
    private exportToHuggingFace(examples: TrainingExample[]): string {
        // Hugging Face format: {"text": "...", "label": "..."}
        const formatted = examples.map(ex => ({
            text: ex.prompt,
            label: ex.completion,
            quality_score: ex.metadata.quality_score,
            metadata: {
                category: ex.metadata.category,
                subject: ex.metadata.subject,
                grade: ex.metadata.grade,
                region: ex.metadata.region
            }
        }));
        
        return JSON.stringify(formatted, null, 2);
    }
    
    /**
     * Export for OpenAI fine-tuning format
     */
    private exportToOpenAI(examples: TrainingExample[]): string {
        // OpenAI format: {"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
        return examples.map(ex => JSON.stringify({
            messages: [
                { role: "system", content: "You are a helpful educational AI assistant for Nigerian schools." },
                { role: "user", content: ex.prompt },
                { role: "assistant", content: ex.completion }
            ]
        })).join('\n');
    }
    
    /**
     * Escape CSV values
     */
    private escapeCSV(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
    
    /**
     * Calculate export statistics
     */
    private calculateStats(examples: TrainingExample[]): ExportStats {
        const exported = this.searchEngine.export();
        const totalExamples = exported.documents.length;
        
        const categoriesDistribution: Record<string, number> = {};
        let totalQuality = 0;
        let totalLength = 0;
        
        for (const example of examples) {
            const category = example.metadata.category || 'unknown';
            categoriesDistribution[category] = (categoriesDistribution[category] || 0) + 1;
            totalQuality += example.metadata.quality_score;
            totalLength += example.completion.length;
        }
        
        return {
            totalExamples,
            exportedExamples: examples.length,
            filteredByQuality: 0, // Would need to track during filtering
            filteredByConfidence: 0,
            filteredByCategory: 0,
            avgQualityScore: examples.length > 0 ? totalQuality / examples.length : 0,
            avgResponseLength: examples.length > 0 ? totalLength / examples.length : 0,
            categoriesDistribution
        };
    }
    
    /**
     * Export and download as file
     */
    public exportToFile(options: ExportFormat, filename?: string): void {
        const { data, stats } = this.export(options);
        
        // Determine file extension
        const extension = options.format === 'csv' ? 'csv' : 'jsonl';
        const defaultFilename = `training_data_${Date.now()}.${extension}`;
        const finalFilename = filename || defaultFilename;
        
        // Create blob and download
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Training data exported:', stats);
    }
    
    /**
     * Preview export (first N examples)
     */
    public preview(options: ExportFormat, limit: number = 5): TrainingExample[] {
        const examples = this.collectTrainingExamples({ ...options, maxExamples: limit });
        return examples;
    }
    
    /**
     * Analyze training data quality
     */
    public analyzeQuality(): {
        qualityDistribution: Record<string, number>;
        recommendations: string[];
    } {
        const exported = this.searchEngine.export();
        const qualityDistribution = {
            'excellent (>0.8)': 0,
            'good (0.6-0.8)': 0,
            'fair (0.4-0.6)': 0,
            'poor (<0.4)': 0
        };
        
        for (const [_, doc] of exported.documents) {
            const quality = scoreResponseQuality(doc.response);
            
            if (quality > 0.8) qualityDistribution['excellent (>0.8)']++;
            else if (quality > 0.6) qualityDistribution['good (0.6-0.8)']++;
            else if (quality > 0.4) qualityDistribution['fair (0.4-0.6)']++;
            else qualityDistribution['poor (<0.4)']++;
        }
        
        const recommendations: string[] = [];
        const total = exported.documents.length;
        
        if (qualityDistribution['excellent (>0.8)'] / total < 0.3) {
            recommendations.push('Consider generating more high-quality examples (>0.8 score)');
        }
        
        if (qualityDistribution['poor (<0.4)'] / total > 0.2) {
            recommendations.push('Remove or improve low-quality examples (<0.4 score)');
        }
        
        if (total < 100) {
            recommendations.push('Collect more training examples (aim for 500+ for fine-tuning)');
        }
        
        return { qualityDistribution, recommendations };
    }
}

// Singleton instance
let exporterInstance: TrainingDataExporter | null = null;

export function getTrainingDataExporter(): TrainingDataExporter {
    if (!exporterInstance) {
        exporterInstance = new TrainingDataExporter();
    }
    return exporterInstance;
}

/**
 * Quick export helpers
 */
export function exportHighQualityExamples(format: 'jsonl' | 'csv' = 'jsonl', minQuality: number = 0.7) {
    const exporter = getTrainingDataExporter();
    return exporter.export({
        format,
        minQualityScore: minQuality,
        minConfidence: 0.6
    });
}

export function exportByCategory(category: string, format: 'jsonl' | 'csv' = 'jsonl') {
    const exporter = getTrainingDataExporter();
    return exporter.export({
        format,
        categories: [category],
        minQualityScore: 0.5
    });
}

export function exportNigerianEducationData() {
    const exporter = getTrainingDataExporter();
    return exporter.export({
        format: 'jsonl',
        minQualityScore: 0.6,
        categories: ['lesson_plan', 'report_comment', 'tutoring', 'exam_prep', 'curriculum']
    });
}

/**
 * Prepare data for specific fine-tuning platforms
 */
export function prepareForHuggingFace(minQuality: number = 0.7, maxExamples?: number) {
    const exporter = getTrainingDataExporter();
    return exporter.export({
        format: 'huggingface',
        minQualityScore: minQuality,
        maxExamples
    });
}

export function prepareForOpenAI(minQuality: number = 0.8, maxExamples?: number) {
    const exporter = getTrainingDataExporter();
    return exporter.export({
        format: 'openai',
        minQualityScore: minQuality,
        maxExamples
    });
}

/**
 * Generate training data report
 */
export function generateTrainingDataReport(): string {
    const exporter = getTrainingDataExporter();
    const analysis = exporter.analyzeQuality();
    const preview = exporter.preview({ format: 'jsonl', minQualityScore: 0.7 }, 3);
    
    let report = '# Training Data Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += '## Quality Distribution\n\n';
    for (const [range, count] of Object.entries(analysis.qualityDistribution)) {
        report += `- ${range}: ${count}\n`;
    }
    
    report += '\n## Recommendations\n\n';
    if (analysis.recommendations.length === 0) {
        report += 'No issues found. Training data quality looks good!\n';
    } else {
        analysis.recommendations.forEach(rec => {
            report += `- ${rec}\n`;
        });
    }
    
    report += '\n## Sample High-Quality Examples\n\n';
    preview.forEach((ex, i) => {
        report += `### Example ${i + 1} (Quality: ${ex.metadata.quality_score.toFixed(2)})\n`;
        report += `**Prompt:** ${ex.prompt.slice(0, 100)}...\n`;
        report += `**Response Length:** ${ex.completion.length} chars\n`;
        report += `**Category:** ${ex.metadata.category || 'N/A'}\n\n`;
    });
    
    return report;
}