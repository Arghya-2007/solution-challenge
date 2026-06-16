import { Controller, Get, Post, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('sync')
  syncProfile(@GetUser() user: any) {
    return this.profileService.syncProfile(user);
  }

  @Get('me')
  getProfile(@GetUser() user: any) {
    return this.profileService.getProfile(user.uid);
  }

  @Patch('me')
  updateProfile(@GetUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.uid, updateProfileDto);
  }

  @Delete('me')
  deleteAccount(@GetUser() user: any) {
    return this.profileService.deleteAccount(user.uid);
  }
}
