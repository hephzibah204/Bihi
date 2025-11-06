import React from 'react';
import { Invoice, SchoolSettings } from '../types';

interface SimpleInvoiceProps {
    invoice: Invoice;
    settings: SchoolSettings;
    compact?: boolean;
}

const SimpleInvoice: React.FC<SimpleInvoiceProps> = ({ invoice, settings, compact = false }) => {
    const containerStyle: React.CSSProperties = {
        padding: compact ? '12mm' : '15mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: compact ? '10px' : '12px',
        lineHeight: '1.4',
        color: '#333',
    };

    const headerStyle: React.CSSProperties = {
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: compact ? '14px' : '18px',
        fontWeight: 'bold',
        margin: '5px 0',
    };

    const sectionStyle: React.CSSProperties = {
        marginTop: '15px',
        marginBottom: '15px',
    };

    const labelStyle: React.CSSProperties = {
        fontWeight: 'bold',
        display: 'inline-block',
        width: '100px',
        marginRight: '10px',
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        marginTop: '10px',
        borderCollapse: 'collapse',
    };

    const tableHeaderStyle: React.CSSProperties = {
        backgroundColor: '#f0f0f0',
        padding: '8px',
        textAlign: 'left',
        fontWeight: 'bold',
        borderBottom: '1px solid #ddd',
    };

    const tableCellStyle: React.CSSProperties = {
        padding: '8px',
        borderBottom: '1px solid #ddd',
    };

    const totalRowStyle: React.CSSProperties = {
        ...tableCellStyle,
        fontWeight: 'bold',
        backgroundColor: '#f9f9f9',
    };

    const footerStyle: React.CSSProperties = {
        marginTop: '20px',
        paddingTop: '10px',
        borderTop: '1px solid #ddd',
        fontSize: compact ? '9px' : '10px',
        textAlign: 'center',
        color: '#666',
    };

    const statusBadgeStyle: React.CSSProperties = {
        padding: '3px 8px',
        borderRadius: '3px',
        backgroundColor: invoice.status === 'paid' ? '#d4edda' : invoice.status === 'unpaid' ? '#f8d7da' : '#fff3cd',
        color: invoice.status === 'paid' ? '#155724' : invoice.status === 'unpaid' ? '#721c24' : '#856404',
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={titleStyle}>{settings.schoolName || 'Invoice'}</div>
                <div>{settings.schoolAddress || ''}</div>
            </div>

            {/* Invoice Title */}
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <div style={{ fontSize: compact ? '12px' : '14px', fontWeight: 'bold' }}>INVOICE</div>
            </div>

            {/* Invoice Details */}
            <div style={sectionStyle}>
                <div>
                    <span style={labelStyle}>Invoice ID:</span>
                    <span>{invoice.id}</span>
                </div>
                <div>
                    <span style={labelStyle}>Class:</span>
                    <span>{invoice.class}</span>
                </div>
                <div>
                    <span style={labelStyle}>Session:</span>
                    <span>{invoice.session}</span>
                </div>
                <div>
                    <span style={labelStyle}>Term:</span>
                    <span>{invoice.term}</span>
                </div>
                <div>
                    <span style={labelStyle}>Issue Date:</span>
                    <span>{invoice.issueDate}</span>
                </div>
                <div>
                    <span style={labelStyle}>Due Date:</span>
                    <span>{invoice.dueDate}</span>
                </div>
                <div>
                    <span style={labelStyle}>Status:</span>
                    <span style={statusBadgeStyle}>
                        {invoice.status.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Items Table */}
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={tableHeaderStyle}>Description</th>
                        <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items && invoice.items.map((item, idx) => (
                        <tr key={idx}>
                            <td style={tableCellStyle}>{item.description}</td>
                            <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                ₦{item.amount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {/* Total Row */}
                    <tr>
                        <td style={totalRowStyle}>Total</td>
                        <td style={{ ...totalRowStyle, textAlign: 'right' }}>
                            ₦{invoice.totalAmount.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td style={totalRowStyle}>Amount Paid</td>
                        <td style={{ ...totalRowStyle, textAlign: 'right' }}>
                            ₦{invoice.amountPaid.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ ...totalRowStyle, backgroundColor: '#e7f3ff' }}>Outstanding Balance</td>
                        <td style={{ ...totalRowStyle, textAlign: 'right', backgroundColor: '#e7f3ff' }}>
                            ₦{(invoice.totalAmount - invoice.amountPaid).toLocaleString()}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Footer */}
            <div style={footerStyle}>
                <div>Thank you for your prompt payment.</div>
                <div style={{ marginTop: '5px' }}>
                    {settings.schoolMotto && <div>{settings.schoolMotto}</div>}
                    {settings.reportCardSettings?.principalName && (
                        <div>Principal: {settings.reportCardSettings.principalName}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimpleInvoice;
