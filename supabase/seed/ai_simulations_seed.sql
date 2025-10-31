-- SEED DATA FOR ai_simulations TABLE
INSERT INTO public.ai_simulations (title, description, url, image_url, subject, keywords)
VALUES
('Ohm’s Law', 'Explore voltage, resistance, and current relationships.',
'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_en.html',
'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law-600.png',
'Physics', ARRAY['electricity','voltage','current','resistance','circuit']),
('States of Matter', 'Visualize molecules in solid, liquid, and gas states.',
'https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_en.html',
'https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter-600.png',
'Chemistry', ARRAY['molecules','solid','liquid','gas','temperature','heat']);
