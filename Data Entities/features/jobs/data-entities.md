# Jobs Data Entities

## Job
- title(required,<=100), description(required,<=2000)
- company: { name(required), logo{ url, publicId }, website, size['startup','small','medium','large','enterprise'], industry, location{ address, city, state, country, coordinates{lat,lng}, isRemote, remoteType['fully_remote','hybrid','on_site'] } }
- employer: UserId(required)
- category(required enum)
- subcategory(required)
- jobType(required)['full_time','part_time','contract','freelance','internship','temporary']
- experienceLevel(required)['entry','junior','mid','senior','lead','executive']
- salary: { min, max, currency('USD'), period['hourly','daily','weekly','monthly','yearly'], isNegotiable, isConfidential }
- benefits: enum array (insurance, PTO, remote_work, etc.)
- requirements: { skills[], education{ level['high_school','associate','bachelor','master','phd','none_required'], field, isRequired }, experience{ years, description }, certifications[], languages[{ language, proficiency['beginner','intermediate','advanced','native'] }], other[] }
- responsibilities[], qualifications[]
- applicationProcess: { deadline, startDate, applicationMethod['email','website','platform','phone'], contactEmail, contactPhone, applicationUrl, instructions }
- status['draft','active','paused','closed','filled']
- visibility['public','private','featured']
- applications: [ { applicant:UserId, appliedAt, status['pending','reviewing','shortlisted','interviewed','rejected','hired'], coverLetter, resume{ url, publicId, filename }, portfolio{ url, description }, expectedSalary, availability, notes, interviewSchedule[{ date, time, type['phone','video','in_person'], location, interviewer, status['scheduled','completed','cancelled','rescheduled'], feedback }], feedback{ rating(1..5), comments, strengths[], weaknesses[], recommendation['strong_hire','hire','no_hire','strong_no_hire'] } } ]
- views { count, unique }
- analytics { applicationsCount, viewsCount, sharesCount, savesCount }
- tags[]
- isActive
- featured { isFeatured, featuredUntil, featuredAt }
- promoted { isPromoted, promotedUntil, promotedAt, promotionType['standard','premium','urgent'] }
- timestamps

### Indexes
- Numerous single and compound indexes for status, category/subcategory, location, jobType/experience, salary ranges, employer, applications, visibility, tags, analytics, updatedAt
- Text index on title, description, company.name, requirements.skills, tags

### Virtuals
- applicationCount
- daysSincePosted

### Methods
- addApplication(applicationData)
- updateApplicationStatus(applicationId, status, feedback?)
- incrementViews(isUnique?)
- isJobActive()
- getSalaryDisplay()

### Statics
- searchJobs(query, filters)
