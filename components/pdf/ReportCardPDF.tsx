import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts (optional - you can use built-in fonts)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1f2937',
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  infoColumn: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    width: 80,
    color: '#374151',
  },
  value: {
    color: '#111827',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1pt solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    flex: 1,
    color: '#374151',
  },
  tableCellCenter: {
    flex: 1,
    textAlign: 'center',
    color: '#374151',
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: 'bold',
    color: '#111827',
  },
  tableCellHeaderCenter: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  summaryColumn: {
    flex: 1,
  },
  summaryLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  remarks: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  remarksTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  remarksText: {
    color: '#111827',
    lineHeight: 1.5,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 20,
  },
  signatureBox: {
    width: 120,
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1pt solid #9ca3af',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 10,
  },
});

interface Subject {
  name: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
  total: number;
  grade: string;
}

interface ReportCardPDFProps {
  student: {
    name: string;
    class: string;
    admissionNo: string;
  };
  schoolName?: string;
  session: string;
  term: string;
  subjects: Subject[];
  totalScore?: number;
  maxScore?: number;
  average?: number;
  position?: number;
  totalStudents?: number;
  classTeacherRemark?: string;
  principalRemark?: string;
  attendance?: {
    present: number;
    absent: number;
    total: number;
  };
}

const ReportCardPDF: React.FC<ReportCardPDFProps> = ({
  student,
  schoolName = 'SCHOOL NAME',
  session,
  term,
  subjects,
  totalScore,
  maxScore,
  average,
  position,
  totalStudents,
  classTeacherRemark,
  principalRemark,
  attendance,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{schoolName.toUpperCase()}</Text>
          <Text style={styles.documentTitle}>STUDENT REPORT CARD</Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{student.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Class:</Text>
              <Text style={styles.value}>{student.class}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Adm. No:</Text>
              <Text style={styles.value}>{student.admissionNo}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Session:</Text>
              <Text style={styles.value}>{session}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Term:</Text>
              <Text style={styles.value}>{term}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Subjects Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellHeader}>Subject</Text>
            {subjects[0]?.ca1 !== undefined && (
              <Text style={styles.tableCellHeaderCenter}>CA1</Text>
            )}
            {subjects[0]?.ca2 !== undefined && (
              <Text style={styles.tableCellHeaderCenter}>CA2</Text>
            )}
            {subjects[0]?.exam !== undefined && (
              <Text style={styles.tableCellHeaderCenter}>Exam</Text>
            )}
            <Text style={styles.tableCellHeaderCenter}>Total</Text>
            <Text style={styles.tableCellHeaderCenter}>Grade</Text>
          </View>

          {/* Table Rows */}
          {subjects.map((subject, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow, 
                index % 2 === 1 ? styles.tableRowEven : {}
              ]}
            >
              <Text style={styles.tableCell}>{subject.name}</Text>
              {subject.ca1 !== undefined && (
                <Text style={styles.tableCellCenter}>{subject.ca1}</Text>
              )}
              {subject.ca2 !== undefined && (
                <Text style={styles.tableCellCenter}>{subject.ca2}</Text>
              )}
              {subject.exam !== undefined && (
                <Text style={styles.tableCellCenter}>{subject.exam}</Text>
              )}
              <Text style={styles.tableCellCenter}>{subject.total}</Text>
              <Text style={styles.tableCellCenter}>{subject.grade}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryColumn}>
            {totalScore && maxScore && (
              <>
                <Text style={styles.summaryLabel}>Total Score:</Text>
                <Text style={styles.summaryValue}>{totalScore}/{maxScore}</Text>
              </>
            )}
          </View>
          <View style={styles.summaryColumn}>
            {average && (
              <>
                <Text style={styles.summaryLabel}>Average:</Text>
                <Text style={styles.summaryValue}>{average.toFixed(1)}%</Text>
              </>
            )}
          </View>
          <View style={styles.summaryColumn}>
            {position && totalStudents && (
              <>
                <Text style={styles.summaryLabel}>Position:</Text>
                <Text style={styles.summaryValue}>{position}/{totalStudents}</Text>
              </>
            )}
          </View>
          <View style={styles.summaryColumn}>
            {attendance && (
              <>
                <Text style={styles.summaryLabel}>Attendance:</Text>
                <Text style={styles.summaryValue}>{attendance.present}/{attendance.total}</Text>
              </>
            )}
          </View>
        </View>

        {/* Remarks */}
        {(classTeacherRemark || principalRemark) && (
          <View style={styles.remarks}>
            {classTeacherRemark && (
              <>
                <Text style={styles.remarksTitle}>Class Teacher's Remark:</Text>
                <Text style={styles.remarksText}>{classTeacherRemark}</Text>
              </>
            )}
            {principalRemark && (
              <>
                <Text style={[styles.remarksTitle, { marginTop: 10 }]}>Principal's Remark:</Text>
                <Text style={styles.remarksText}>{principalRemark}</Text>
              </>
            )}
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Class Teacher</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Principal</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} • Powered by ReportSheet
        </Text>
      </Page>
    </Document>
  );
};

export default ReportCardPDF;
