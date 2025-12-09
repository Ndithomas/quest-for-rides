import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDetailComponent } from './user-detail.component';

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user details on init', () => {
    spyOn(component, 'loadUserDetail');
    component.ngOnInit();
    expect(component.loadUserDetail).toHaveBeenCalled();
  });

  it('should display user information when loaded', () => {
    component.user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'guest',
      status: 'active',
      created_at: '2025-12-02'
    };
    component.loading = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test User');
    expect(compiled.textContent).toContain('@testuser');
  });

  it('should change user status', () => {
    component.user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'guest',
      status: 'active',
      created_at: '2025-12-02'
    };
    component.selectedStatus = 'suspended';

    spyOn(component['userActions'], 'changeUserStatus').and.returnValue(
      { subscribe: (callback: any) => callback() } as any
    );

    component.changeStatus();
    expect(component['userActions'].changeUserStatus).toHaveBeenCalledWith(1, 'suspended');
  });

  it('should display error message on load failure', () => {
    component.loading = false;
    component.user = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('User not found');
  });
});
