import React from 'react';

interface KendoReportCardPDFProps {
  student: {
    name: string;
    class: string;
    admissionNo: string;
  };
  schoolName?: string;
  session: string;
  term: string;
  subjects: Array<{
    name: string;
    ca1?: number;
    ca2?: number;
    exam?: number;
    total: number;
    grade: string;
  }>;
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

const KendoReportCardPDF: React.FC<KendoReportCardPDFProps> = ({
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
    <div className="kendo-pdf-content" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      lineHeight: '1.4',
      color: 'black',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #333',
        paddingBottom: '15px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 10px 0',
          color: '#1f2937',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {schoolName}
        </h1>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0',
          color: '#374151',
          textTransform: 'uppercase'
        }}>
          Student Report Card
        </h2>
      </div>

      {/* Student Information */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '25px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#495057', width: '100px', display: 'inline-block' }}>
              Name:
            </span>
            <span style={{ color: '#212529' }}>{student.name}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#495057', width: '100px', display: 'inline-block' }}>
              Class:
            </span>
            <span style={{ color: '#212529' }}>{student.class}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#495057', width: '100px', display: 'inline-block' }}>
              Adm. No:
            </span>
            <span style={{ color: '#212529' }}>{student.admissionNo}</span>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#495057', width: '100px', display: 'inline-block' }}>
              Session:
            </span>
            <span style={{ color: '#212529' }}>{session}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#495057', width: '100px', display: 'inline-block' }}>
              Term:
            </span>
            <span style={{ color: '#212529' }}>{term}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#495057', width: '100px', display: 'inline-block' }}>
              Date:
            </span>
            <span style={{ color: '#212529' }}>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div style={{ marginBottom: '25px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #dee2e6',
          backgroundColor: 'white'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{
                padding: '12px 8px',
                border: '1px solid #dee2e6',
                fontWeight: 'bold',
                textAlign: 'left',
                color: '#495057'
              }}>
                Subject
              </th>
              {subjects[0]?.ca1 !== undefined && (
                <th style={{
                  padding: '12px 8px',
                  border: '1px solid #dee2e6',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#495057'
                }}>
                  CA1
                </th>
              )}
              {subjects[0]?.ca2 !== undefined && (
                <th style={{
                  padding: '12px 8px',
                  border: '1px solid #dee2e6',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#495057'
                }}>
                  CA2
                </th>
              )}
              {subjects[0]?.exam !== undefined && (
                <th style={{
                  padding: '12px 8px',
                  border: '1px solid #dee2e6',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#495057'
                }}>
                  Exam
                </th>
              )}
              <th style={{
                padding: '12px 8px',
                border: '1px solid #dee2e6',
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#495057'
              }}>
                Total
              </th>
              <th style={{
                padding: '12px 8px',
                border: '1px solid #dee2e6',
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#495057'
              }}>
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={index} style={{
                backgroundColor: index % 2 === 1 ? '#f8f9fa' : 'white'
              }}>
                <td style={{
                  padding: '10px 8px',
                  border: '1px solid #dee2e6',
                  color: '#212529'
                }}>
                  {subject.name}
                </td>
                {subject.ca1 !== undefined && (
                  <td style={{
                    padding: '10px 8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center',
                    color: '#212529'
                  }}>
                    {subject.ca1}
                  </td>
                )}
                {subject.ca2 !== undefined && (
                  <td style={{
                    padding: '10px 8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center',
                    color: '#212529'
                  }}>
                    {subject.ca2}
                  </td>
                )}
                {subject.exam !== undefined && (
                  <td style={{
                    padding: '10px 8px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center',
                    color: '#212529'
                  }}>
                    {subject.exam}
                  </td>
                )}
                <td style={{
                  padding: '10px 8px',
                  border: '1px solid #dee2e6',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#212529'
                }}>
                  {subject.total}
                </td>
                <td style={{
                  padding: '10px 8px',
                  border: '1px solid #dee2e6',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: subject.grade === 'A' ? '#28a745' : subject.grade === 'F' ? '#dc3545' : '#212529'
                }}>
                  {subject.grade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
        marginBottom: '25px',
        padding: '15px',
        backgroundColor: '#e9ecef',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        {totalScore && maxScore && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>
              Total Score
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#212529' }}>
              {totalScore}/{maxScore}
            </div>
          </div>
        )}
        {average && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>
              Average
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#212529' }}>
              {average.toFixed(1)}%
            </div>
          </div>
        )}
        {position && totalStudents && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>
              Position
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#212529' }}>
              {position}/{totalStudents}
            </div>
          </div>
        )}
        {attendance && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>
              Attendance
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#212529' }}>
              {attendance.present}/{attendance.total}
            </div>
          </div>
        )}
      </div>

      {/* Remarks */}
      {(classTeacherRemark || principalRemark) && (
        <div style={{
          marginBottom: '30px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          {classTeacherRemark && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '8px' }}>
                Class Teacher's Remark:
              </div>
              <div style={{ color: '#212529', lineHeight: '1.5' }}>
                {classTeacherRemark}
              </div>
            </div>
          )}
          {principalRemark && (
            <div>
              <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '8px' }}>
                Principal's Remark:
              </div>
              <div style={{ color: '#212529', lineHeight: '1.5' }}>
                {principalRemark}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '40px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', width: '150px' }}>
          <div style={{
            borderTop: '1px solid #6c757d',
            marginBottom: '8px',
            height: '40px'
          }} />
          <div style={{ fontSize: '11px', color: '#6c757d' }}>
            Class Teacher
          </div>
        </div>
        <div style={{ textAlign: 'center', width: '150px' }}>
          <div style={{
            borderTop: '1px solid #6c757d',
            marginBottom: '8px',
            height: '40px'
          }} />
          <div style={{ fontSize: '11px', color: '#6c757d' }}>
            Principal
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '20mm',
        left: '20mm',
        right: '20mm',
        textAlign: 'center',
        fontSize: '10px',
        color: '#6c757d',
        borderTop: '1px solid #dee2e6',
        paddingTop: '10px'
      }}>
        Generated on {new Date().toLocaleDateString()} • Powered by ReportSheet
      </div>
    </div>
  );
};

export default KendoReportCardPDF;
