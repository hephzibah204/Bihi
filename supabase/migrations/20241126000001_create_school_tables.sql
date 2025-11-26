-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    motto TEXT,
    description TEXT,
    logo TEXT,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    established TEXT,
    principal_name TEXT,
    principal_message TEXT,
    stats JSONB DEFAULT '{}',
    social_media JSONB DEFAULT '{}',
    landing_page_content JSONB DEFAULT '{}',
    admission_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admission_applications table
CREATE TABLE IF NOT EXISTS admission_applications (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student JSONB NOT NULL,
    parent JSONB NOT NULL,
    application_details JSONB NOT NULL,
    documents JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'accepted', 'rejected', 'waitlisted')),
    submission_date TIMESTAMP WITH TIME ZONE NOT NULL,
    review_date TIMESTAMP WITH TIME ZONE,
    interview_date TIMESTAMP WITH TIME ZONE,
    decision_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    reviewed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_admission_applications_school_id ON admission_applications(school_id);
CREATE INDEX IF NOT EXISTS idx_admission_applications_status ON admission_applications(status);
CREATE INDEX IF NOT EXISTS idx_admission_applications_submission_date ON admission_applications(submission_date DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admission_applications_updated_at ON admission_applications;
CREATE TRIGGER update_admission_applications_updated_at
    BEFORE UPDATE ON admission_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for schools
DROP POLICY IF EXISTS "Schools are viewable by everyone" ON schools;
CREATE POLICY "Schools are viewable by everyone"
    ON schools FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Schools are editable by authenticated users" ON schools;
CREATE POLICY "Schools are editable by authenticated users"
    ON schools FOR ALL
    USING (auth.role() = 'authenticated');

-- Create RLS policies for admission_applications
DROP POLICY IF EXISTS "Admission applications are viewable by school admins" ON admission_applications;
CREATE POLICY "Admission applications are viewable by school admins"
    ON admission_applications FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admission applications can be inserted by anyone" ON admission_applications;
CREATE POLICY "Admission applications can be inserted by anyone"
    ON admission_applications FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admission applications are editable by authenticated users" ON admission_applications;
CREATE POLICY "Admission applications are editable by authenticated users"
    ON admission_applications FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Insert demo data
INSERT INTO schools (
    id, name, slug, motto, description, logo, address, phone, email, website, established, principal_name, principal_message,
    stats, social_media, landing_page_content, admission_settings
) VALUES 
(
    'school_1',
    'Greenwood International Academy',
    'greenwood-academy',
    'Excellence Through Innovation',
    'A premier international school committed to nurturing global citizens through innovative education and character development.',
    '/demo/schools/greenwood-logo.png',
    '123 Education Drive, Victoria Island, Lagos, Nigeria',
    '+234 801 234 5678',
    'info@greenwoodacademy.edu.ng',
    'https://greenwoodacademy.edu.ng',
    '1995',
    'Dr. Adaora Okafor',
    'Welcome to Greenwood International Academy, where we believe every child has the potential to excel.',
    '{"students": "850+", "teachers": "65+", "yearsOfExcellence": "28+", "graduationRate": "98%"}',
    '{"facebook": "https://facebook.com/greenwoodacademy", "twitter": "https://twitter.com/greenwoodacademy", "instagram": "https://instagram.com/greenwoodacademy"}',
    '{"hero": {"title": "Shaping Tomorrow''s Global Leaders Today", "subtitle": "At Greenwood International Academy, we provide world-class education that prepares students for success in a rapidly changing world."}}',
    '{"isOpen": true, "applicationDeadline": "2024-06-30", "academicYear": "2024/2025", "availableClasses": ["Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"]}'
),
(
    'school_2',
    'Heritage Grammar School',
    'heritage-grammar',
    'Tradition, Excellence, Character',
    'A distinguished grammar school with over 50 years of academic excellence, combining traditional values with modern educational approaches.',
    '/demo/schools/heritage-logo.png',
    '45 Heritage Avenue, Ikeja, Lagos, Nigeria',
    '+234 802 345 6789',
    'info@heritagegrammar.edu.ng',
    'https://heritagegrammar.edu.ng',
    '1970',
    'Mr. Olumide Fashola',
    'At Heritage Grammar School, we uphold the finest traditions of academic excellence while preparing our students for the challenges of tomorrow.',
    '{"students": "1,200+", "teachers": "85+", "yearsOfExcellence": "53+", "graduationRate": "99%"}',
    '{"facebook": "https://facebook.com/heritagegrammar", "twitter": "https://twitter.com/heritagegrammar"}',
    '{"hero": {"title": "Where Tradition Meets Excellence", "subtitle": "For over 50 years, Heritage Grammar School has been nurturing young minds and building character."}}',
    '{"isOpen": true, "applicationDeadline": "2024-05-31", "academicYear": "2024/2025", "availableClasses": ["JSS1", "JSS2", "JSS3", "SS1", "SS2"]}'
),
(
    'school_3',
    'Bright Stars Montessori',
    'bright-stars-montessori',
    'Nurturing Young Minds',
    'A child-centered Montessori school focusing on individualized learning and holistic development for children aged 2-12 years.',
    '/demo/schools/brightstars-logo.png',
    '78 Child Development Close, Lekki, Lagos, Nigeria',
    '+234 803 456 7890',
    'info@brightstars.edu.ng',
    'https://brightstars.edu.ng',
    '2010',
    'Mrs. Sarah Okafor',
    'At Bright Stars Montessori, we believe in the natural curiosity and potential of every child.',
    '{"students": "180+", "teachers": "25+", "yearsOfExcellence": "13+", "graduationRate": "100%"}',
    '{"facebook": "https://facebook.com/brightstars", "instagram": "https://instagram.com/brightstars"}',
    '{"hero": {"title": "Where Every Child Shines Bright", "subtitle": "Discover the joy of learning through our authentic Montessori approach."}}',
    '{"isOpen": true, "applicationDeadline": "2024-07-15", "academicYear": "2024/2025", "availableClasses": ["Toddler Community", "Children''s House", "Elementary Lower", "Elementary Upper"]}'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    motto = EXCLUDED.motto,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert demo admission applications
INSERT INTO admission_applications (
    id, school_id, student, parent, application_details, documents, status, submission_date
) VALUES 
(
    'app_001',
    'school_1',
    '{"firstName": "Adaeze", "lastName": "Okafor", "dateOfBirth": "2010-03-15", "gender": "Female", "classApplyingFor": "Year 7"}',
    '{"title": "Mrs.", "firstName": "Ngozi", "lastName": "Okafor", "relationship": "Mother", "phone": "+234 803 123 4567", "email": "ngozi.okafor@email.com", "address": "15 Admiralty Way, Lekki Phase 1, Lagos"}',
    '{"preferredStartDate": "2024-09-01", "hasSpecialNeeds": false, "reasonForApplication": "We are impressed by Greenwood''s international curriculum and excellent reputation.", "howDidYouHearAboutUs": "Friend/Family"}',
    '{"birthCertificate": "/demo/documents/birth-cert-001.pdf", "passportPhotograph": "/demo/documents/passport-001.jpg"}',
    'submitted',
    '2024-01-15T10:30:00Z'
),
(
    'app_002',
    'school_1',
    '{"firstName": "Kemi", "lastName": "Johnson", "dateOfBirth": "2012-07-22", "gender": "Female", "classApplyingFor": "Year 5"}',
    '{"title": "Dr.", "firstName": "Funmi", "lastName": "Johnson", "relationship": "Mother", "phone": "+234 805 234 5678", "email": "funmi.johnson@email.com", "address": "42 Banana Island Road, Ikoyi, Lagos"}',
    '{"preferredStartDate": "2024-09-01", "hasSpecialNeeds": false, "reasonForApplication": "Seeking a school with strong STEM programs and international exposure.", "howDidYouHearAboutUs": "Website"}',
    '{"birthCertificate": "/demo/documents/birth-cert-002.pdf", "passportPhotograph": "/demo/documents/passport-002.jpg"}',
    'under_review',
    '2024-01-20T14:15:00Z'
),
(
    'app_003',
    'school_2',
    '{"firstName": "Tunde", "lastName": "Adeyemi", "dateOfBirth": "2011-11-08", "gender": "Male", "classApplyingFor": "JSS2"}',
    '{"title": "Alhaji", "firstName": "Rasheed", "lastName": "Adeyemi", "relationship": "Father", "phone": "+234 807 345 6789", "email": "rasheed.adeyemi@email.com", "address": "28 Allen Avenue, Ikeja, Lagos"}',
    '{"preferredStartDate": "2024-09-01", "hasSpecialNeeds": false, "reasonForApplication": "Heritage Grammar School has an excellent reputation for discipline and academic excellence.", "howDidYouHearAboutUs": "Advertisement"}',
    '{"birthCertificate": "/demo/documents/birth-cert-003.pdf", "passportPhotograph": "/demo/documents/passport-003.jpg"}',
    'accepted',
    '2024-01-10T11:45:00Z'
)
ON CONFLICT (id) DO NOTHING;
