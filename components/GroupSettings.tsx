'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useOrganization } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GroupSettings() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (organization) {
      setGroupName(organization.name);
    }
  }, [organization]);

  const handleSaveName = async () => {
    if (!organization || !groupName.trim() || groupName === organization.name) return;

    setSaving(true);
    try {
      await organization.update({ name: groupName });
      toast({ title: 'Success', description: 'Group name updated' });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as { errors?: { message: string }[] }).errors?.[0]?.message || 'Failed to update group name',
        variant: 'destructive',
      });
      setGroupName(organization.name); // revert on error
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!organization) return;
    
    setDeleting(true);
    try {
      await organization.destroy();
      toast({ title: 'Group deleted', description: 'The group has been permanently deleted.' });
      router.push('/groups');
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as { errors?: { message: string }[] }).errors?.[0]?.message || 'Failed to delete group',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  if (!organization) return null;

  return (
    <div className="space-y-8">
      {/* Edit Group Name */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Group Name</h3>
          <div className="flex gap-3">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-grow"
              placeholder="Enter group name"
            />
            <Button 
              onClick={handleSaveName} 
              disabled={saving || groupName.trim() === '' || groupName === organization.name}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <div>
              <h4 className="font-semibold text-gray-900">Delete Group</h4>
              <p className="text-sm text-gray-500 max-w-md">
                Once you delete a group, there is no going back. All expenses data associated with this group will remain in the database but the group membership will be permanently deleted.
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">Delete Group</DialogTitle>
                  <DialogDescription>
                    This action is irreversible. To confirm deletion, please type the group name <strong className="select-none">{organization.name}</strong> below.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <Input 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={organization.name}
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setDeleteConfirmText('')}>Cancel</Button>
                  </DialogClose>
                  <Button 
                    variant="destructive" 
                    disabled={deleteConfirmText !== organization.name || deleting}
                    onClick={handleDeleteGroup}
                  >
                    {deleting ? 'Deleting...' : 'I understand, delete group'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
