const base = 'http://localhost:4173';
async function test() {
  // 1. Public registration is gone
  console.log('=== Test: Public registration (should be 401) ===');
  let r = await fetch(base + '/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: 'test', fromPublicForm: true }) });
  console.log('Status:', r.status, 'Body:', await r.text());

  // 2. Admin login
  console.log('\n=== Test: Admin login ===');
  r = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin', password: 'BENCHOUBAN2026' }) });
  const cookie = r.headers.get('set-cookie').split(';')[0];
  console.log('Login:', r.status);

  // 3. Admin summary
  console.log('\n=== Test: Admin summary ===');
  r = await fetch(base + '/api/admin/summary', { headers: { Cookie: cookie } });
  const summary = await r.json();
  console.log('Students:', summary.students, 'Departments:', summary.departments);

  // 4. Add student via admin (within department)
  console.log('\n=== Test: Add student via admin ===');
  const deps = await (await fetch(base + '/api/departments')).json();
  const dept = deps[0];
  console.log('Using dept:', dept.id, dept.name, 'studentsCount:', dept.studentsCount);
  r = await fetch(base + '/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ fullName: 'طالب اختبار', age: '10', phone: '012345', academicLevel: 'الابتدائي', address: 'القاهرة', departmentId: dept.id, departmentName: dept.name }) });
  const newStudent = await r.json();
  console.log('Created student:', r.status, newStudent.id, newStudent.fullName, 'deptId:', newStudent.departmentId);

  // 5. Verify stats updated
  console.log('\n=== Test: Stats after adding student ===');
  r = await fetch(base + '/api/admin/summary', { headers: { Cookie: cookie } });
  const summary2 = await r.json();
  console.log('Students:', summary2.students, '(should be', summary.students + 1, ')');

  // 6. Verify department student count updated
  console.log('\n=== Test: Dept student count ===');
  const deps2 = await (await fetch(base + '/api/departments')).json();
  const dept2 = deps2.find(d => d.id === dept.id);
  console.log('Dept studentsCount:', dept2.studentsCount, '(should be', dept.studentsCount + 1, ')');

  // 7. Delete student
  console.log('\n=== Test: Delete student ===');
  r = await fetch(base + `/api/students/${newStudent.id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  console.log('Delete:', r.status);

  // 8. Verify stats after delete
  console.log('\n=== Test: Stats after deleting student ===');
  r = await fetch(base + '/api/admin/summary', { headers: { Cookie: cookie } });
  const summary3 = await r.json();
  console.log('Students:', summary3.students, '(should be', summary.students, ')');

  // 9. Verify dept count after delete
  const deps3 = await (await fetch(base + '/api/departments')).json();
  const dept3 = deps3.find(d => d.id === dept.id);
  console.log('Dept studentsCount:', dept3.studentsCount, '(should be', dept.studentsCount, ')');

  // 10. Add student and delete department (cascade)
  console.log('\n=== Test: Cascade delete ===');
  r = await fetch(base + '/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ fullName: 'طالب للحذف', age: '8', phone: '999', academicLevel: 'الابتدائي', address: 'test', departmentId: dept.id, departmentName: dept.name }) });
  const cascStudent = await r.json();
  console.log('Added student:', cascStudent.id);

  // Delete the department
  r = await fetch(base + `/api/departments/${dept.id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  console.log('Deleted dept:', r.status);

  // Verify student is also gone
  r = await fetch(base + `/api/students/${cascStudent.id}`, { headers: { Cookie: cookie } });
  console.log('Student after dept delete:', r.status, '(should be 404)');

  // Verify total students decreased
  r = await fetch(base + '/api/admin/summary', { headers: { Cookie: cookie } });
  const summary4 = await r.json();
  console.log('Students after cascade:', summary4.students, '(should be', summary3.students - 1, ')');

  // 11. Test /register redirects
  console.log('\n=== Test: /register redirects ===');
  r = await fetch(base + '/register', { redirect: 'manual' });
  console.log('Status:', r.status, 'Location:', r.headers.get('location'));

  console.log('\n=== ALL TESTS COMPLETE ===');
}
test().catch(e => console.error('ERROR:', e));
