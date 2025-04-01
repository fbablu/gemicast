import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutagesComponent } from './outages.component';

describe('OutagesComponent', () => {
  let component: OutagesComponent;
  let fixture: ComponentFixture<OutagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutagesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OutagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
